// Mock JobRepository — operates on the in-memory seed arrays in data.ts.
// Reads return deep clones so callers cannot mutate the seed state.
// When DATA_BACKEND !== 'sheets', getRepository() returns an instance of this.

import type {
  ActivityEvent,
} from "../enums";
import type {
  ActivityLog,
  CreateJobInput,
  CreateNotificationInput,
  CreateTodoInput,
  CurrentUser,
  JobCard,
  JobFilter,
  JobPatch,
  Notification,
  Template,
  TeamMember,
  Todo,
  TodoPatch,
} from "../types";
import type {
  CreateTeamMemberInput,
  CreateTemplateInput,
  JobRepository,
  TeamMemberPatch,
  TemplatePatch,
  UpdateJobOptions,
} from "../repository";
import { notify } from "../notify";
import { extractMentionTokens, resolveMentionCsIds } from "../notifications/policy";
import { isNearDeadline, isOverdue, nextJobId, nowIso } from "../utils";
import { activity as seedActivity, jobs as seedJobs, templates as seedTemplates, team as seedTeam, todos as seedTodos } from "./data";

// Module-level mutable state (mock only). Seeded once at first import.
const store = {
  jobs: structuredClone(seedJobs) as JobCard[],
  todos: structuredClone(seedTodos) as Todo[],
  activity: structuredClone(seedActivity) as ActivityLog[],
  team: structuredClone(seedTeam) as TeamMember[],
  templates: structuredClone(seedTemplates) as Template[],
  notifications: [] as Notification[],
};

/** Deep clone helper — keeps mock state private. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

function maxSeq(ids: string[], prefix: string, width: number): number {
  const re = new RegExp(`^${prefix}-(\\d{${width}})$`);
  let max = 0;
  for (const id of ids) {
    const m = id.match(re);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return max;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * Derive a csId slug from displayName. Lowercases ascii runs; non-ascii names
 * (e.g. Thai) yield an empty slug and fall back to `member-NN`. Collisions with
 * existing ids also fall back to `member-NN` (next free sequence).
 */
function deriveCsId(displayName: string, existing: Set<string>): string {
  const explicit = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (explicit && !existing.has(explicit)) return explicit;
  let n = 1;
  while (existing.has(`member-${pad(n, 2)}`)) n++;
  return `member-${pad(n, 2)}`;
}

function appendLog(entry: Omit<ActivityLog, "logId">): ActivityLog {
  const next = maxSeq(store.activity.map((a) => a.logId), "LOG", 6) + 1;
  const log: ActivityLog = { ...entry, logId: `LOG-${pad(next, 6)}` };
  store.activity.push(log);
  return log;
}

export class MockJobRepository implements JobRepository {
  async listJobs(filter?: JobFilter): Promise<JobCard[]> {
    let result = clone(store.jobs);
    if (filter) {
      if (filter.owner) result = result.filter((j) => j.owner === filter.owner);
      if (filter.status) result = result.filter((j) => j.status === filter.status);
      if (filter.serviceType)
        result = result.filter((j) => j.serviceType === filter.serviceType);
      if (filter.overdue) result = result.filter((j) => isOverdue(j));
      if (filter.nearDeadline) result = result.filter((j) => isNearDeadline(j));
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(
          (j) =>
            j.customer.toLowerCase().includes(q) ||
            j.jobId.toLowerCase().includes(q) ||
            (j.bookingNumber ?? "").toLowerCase().includes(q) ||
            (j.route ?? "").toLowerCase().includes(q),
        );
      }
    }
    return result;
  }

  async getJob(jobId: string): Promise<JobCard | null> {
    const found = store.jobs.find((j) => j.jobId === jobId);
    return found ? clone(found) : null;
  }

  async createJob(input: CreateJobInput, currentUser: CurrentUser): Promise<JobCard> {
    const createdAt = nowIso();
    const jobId = nextJobId(store.jobs.map((j) => j.jobId));

    const job: JobCard = {
      jobId,
      customer: input.customer,
      bookingNumber: input.bookingNumber,
      shipmentType: input.shipmentType,
      serviceType: input.serviceType,
      route: input.route,
      origin: input.origin,
      destination: input.destination,
      carrier: input.carrier,
      owner: input.owner,
      backup: input.backup,
      status: input.status ?? "New",
      priority: input.priority,
      deadline: input.deadline,
      cutoff: input.cutoff,
      etd: input.etd,
      eta: input.eta,
      latestSummary: input.latestSummary,
      docLinks: input.docLinks ? [...input.docLinks] : undefined,
      createdBy: currentUser.csId,
      createdAt,
      updatedAt: createdAt,
    };
    store.jobs.push(job);

    appendLog({
      jobId,
      actor: currentUser.csId,
      timestamp: createdAt,
      event: "job_created",
    });

    // Seed template To-dos when a matching template exists.
    const matching = store.templates
      .filter((t) => t.templateType === job.serviceType)
      .sort((a, b) => a.order - b.order);
    for (const t of matching) {
      this.seedTemplateTodo(job, t, currentUser);
    }

    await notify("job_created", {
      jobId,
      customer: job.customer,
      job,
      actor: currentUser.csId,
    });

    return clone(job);
  }

  async updateJob(
    jobId: string,
    patch: JobPatch,
    currentUser: CurrentUser,
    options?: UpdateJobOptions,
  ): Promise<JobCard> {
    const idx = store.jobs.findIndex((j) => j.jobId === jobId);
    if (idx === -1) throw new Error(`Job not found: ${jobId}`);

    const before = store.jobs[idx];
    if (!before) throw new Error(`Job not found: ${jobId}`);

    const timestamp = nowIso();

    // Track changes that warrant an ActivityLog row.
    const statusChanged = patch.status !== undefined && patch.status !== before.status;
    const ownerChanged = patch.owner !== undefined && patch.owner !== before.owner;
    const deadlineChanged =
      patch.deadline !== undefined && patch.deadline !== before.deadline;

    if (ownerChanged && !options?.reason) {
      throw new Error("owner_changed requires a reason");
    }
    if (deadlineChanged && !options?.reason) {
      throw new Error("deadline_changed requires a reason");
    }

    // Enforce exactly-one-owner: owner may change but cannot be removed.
    if ("owner" in patch && patch.owner !== undefined && patch.owner.trim() === "") {
      throw new Error("owner must be exactly one team member");
    }

    const updated: JobCard = { ...before, ...patch, updatedAt: timestamp };
    store.jobs[idx] = updated;

    const actor = currentUser.csId;
    if (statusChanged) {
      const beforeStatus = before.status;
      const afterStatus = patch.status;
      if (afterStatus !== undefined) {
        const event: ActivityEvent =
          afterStatus === "Completed" ? "job_closed" : "status_changed";
        appendLog({
          jobId,
          actor,
          timestamp,
          event,
          field: "status",
          oldValue: beforeStatus,
          newValue: afterStatus,
          reason: options?.reason,
        });
        // Policy skips non-meaningful transitions (e.g. New → In Progress).
        await notify(event, {
          jobId,
          customer: updated.customer,
          job: updated,
          oldValue: beforeStatus,
          newValue: afterStatus,
          reason: options?.reason,
          actor,
        });
      }
    }
    if (ownerChanged) {
      const beforeOwner = before.owner;
      const afterOwner = patch.owner;
      if (afterOwner !== undefined) {
        appendLog({
          jobId,
          actor,
          timestamp,
          event: "owner_changed",
          field: "owner",
          oldValue: beforeOwner,
          newValue: afterOwner,
          reason: options?.reason,
        });
        await notify("owner_changed", {
          jobId,
          customer: updated.customer,
          job: updated,
          oldValue: beforeOwner,
          newValue: afterOwner,
          reason: options?.reason,
          actor,
        });
      }
    }
    if (deadlineChanged) {
      appendLog({
        jobId,
        actor,
        timestamp,
        event: "deadline_changed",
        field: "deadline",
        oldValue: before.deadline,
        newValue: patch.deadline,
        reason: options?.reason,
      });
      await notify("deadline_changed", {
        jobId,
        customer: updated.customer,
        job: updated,
        oldValue: before.deadline,
        newValue: patch.deadline,
        reason: options?.reason,
        actor,
      });
    }

    return clone(updated);
  }

  async listTodos(jobId: string): Promise<Todo[]> {
    return clone(store.todos.filter((t) => t.jobId === jobId));
  }

  async createTodo(input: CreateTodoInput, currentUser: CurrentUser): Promise<Todo> {
    const createdAt = nowIso();
    const next = maxSeq(store.todos.map((t) => t.todoId), "TODO", 5) + 1;
    const todo: Todo = {
      todoId: `TODO-${pad(next, 5)}`,
      jobId: input.jobId,
      title: input.title,
      assignee: input.assignee,
      status: input.status ?? "Not Started",
      deadline: input.deadline,
      source: input.source,
      createdBy: currentUser.csId,
      createdAt,
    };
    store.todos.push(todo);

    appendLog({
      jobId: input.jobId,
      actor: currentUser.csId,
      timestamp: createdAt,
      event: "todo_added",
      field: "todoId",
      newValue: todo.todoId,
    });

    return clone(todo);
  }

  async updateTodo(
    todoId: string,
    patch: TodoPatch,
    currentUser: CurrentUser,
  ): Promise<Todo> {
    const idx = store.todos.findIndex((t) => t.todoId === todoId);
    if (idx === -1) throw new Error(`Todo not found: ${todoId}`);
    const before = store.todos[idx];
    if (!before) throw new Error(`Todo not found: ${todoId}`);

    const timestamp = nowIso();
    const becameDone = patch.status === "Done" && before.status !== "Done";
    const updated: Todo = { ...before, ...patch };
    if (becameDone && !updated.completedAt) {
      updated.completedAt = timestamp;
    }
    store.todos[idx] = updated;

    if (becameDone) {
      appendLog({
        jobId: before.jobId,
        actor: currentUser.csId,
        timestamp,
        event: "todo_completed",
        field: "todoId",
        oldValue: before.status,
        newValue: "Done",
      });
    }

    return clone(updated);
  }

  async deleteTodo(todoId: string): Promise<void> {
    const idx = store.todos.findIndex((t) => t.todoId === todoId);
    if (idx === -1) return;
    store.todos = store.todos.filter((t) => t.todoId !== todoId);
  }

  async addNote(jobId: string, text: string, currentUser: CurrentUser): Promise<ActivityLog> {
    const timestamp = nowIso();
    const log = appendLog({
      jobId,
      actor: currentUser.csId,
      timestamp,
      event: "note_added",
      field: "note",
      newValue: text,
    });

    // Parse @mentions → csIds, then notify the owner + any mentioned members.
    try {
      const job = store.jobs.find((j) => j.jobId === jobId);
      if (job) {
        const tokens = extractMentionTokens(text);
        const team = await this.listTeam();
        const mentioned = resolveMentionCsIds(tokens, team);
        await notify("note_added", {
          jobId,
          customer: job.customer,
          job,
          newValue: text,
          actor: currentUser.csId,
          extra: { mentioned },
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[notify][note_added] mention resolution failed", error);
      }
    }

    return log;
  }

  async listActivity(jobId: string): Promise<ActivityLog[]> {
    return clone(store.activity.filter((a) => a.jobId === jobId));
  }

  async listTeam(): Promise<TeamMember[]> {
    return clone(store.team);
  }

  async listTemplates(type?: Template["templateType"]): Promise<Template[]> {
    const all = clone(store.templates);
    return type ? all.filter((t) => t.templateType === type) : all;
  }

  async createTeamMember(
    input: CreateTeamMemberInput,
    currentUser: CurrentUser,
  ): Promise<TeamMember> {
    void currentUser; // actor reserved for future audit (ActivityLog is job-scoped)
    const existing = new Set(store.team.map((m) => m.csId));
    const csId = input.csId?.trim()
      ? input.csId.trim().toLowerCase()
      : deriveCsId(input.displayName, existing);
    if (existing.has(csId)) {
      throw new Error(`csId ซ้ำ: ${csId}`);
    }
    const member: TeamMember = {
      csId,
      displayName: input.displayName,
      role: input.role,
      active: true,
      email: input.email,
    };
    store.team.push(member);
    return clone(member);
  }

  async updateTeamMember(
    csId: string,
    patch: TeamMemberPatch,
    currentUser: CurrentUser,
  ): Promise<TeamMember> {
    void currentUser; // actor reserved for future audit (ActivityLog is job-scoped)
    const idx = store.team.findIndex((m) => m.csId === csId);
    if (idx === -1) throw new Error(`TeamMember not found: ${csId}`);
    const before = store.team[idx];
    if (!before) throw new Error(`TeamMember not found: ${csId}`);
    const updated: TeamMember = { ...before, ...patch };
    store.team[idx] = updated;
    return clone(updated);
  }

  async createTemplate(
    input: CreateTemplateInput,
    currentUser: CurrentUser,
  ): Promise<Template> {
    void currentUser; // actor reserved for future audit (ActivityLog is job-scoped)
    const template: Template = {
      templateType: input.templateType,
      order: input.order,
      todoTitle: input.todoTitle,
      deadlineOffsetHours: input.deadlineOffsetHours,
      notes: input.notes,
    };
    store.templates.push(template);
    return clone(template);
  }

  async updateTemplate(
    templateType: Template["templateType"],
    order: number,
    patch: TemplatePatch,
    currentUser: CurrentUser,
  ): Promise<Template> {
    void currentUser; // actor reserved for future audit (ActivityLog is job-scoped)
    const idx = store.templates.findIndex(
      (t) => t.templateType === templateType && t.order === order,
    );
    if (idx === -1) {
      throw new Error(`Template not found: ${templateType} #${order}`);
    }
    const before = store.templates[idx];
    if (!before) throw new Error(`Template not found: ${templateType} #${order}`);
    const updated: Template = { ...before, ...patch };
    store.templates[idx] = updated;
    return clone(updated);
  }

  async deleteTemplate(
    templateType: Template["templateType"],
    order: number,
    currentUser: CurrentUser,
  ): Promise<void> {
    void currentUser; // actor reserved for future audit (ActivityLog is job-scoped)
    store.templates = store.templates.filter(
      (t) => !(t.templateType === templateType && t.order === order),
    );
  }

  async appendNotification(input: CreateNotificationInput): Promise<Notification> {
    const createdAt = nowIso();
    const next = maxSeq(store.notifications.map((n) => n.notifId), "NOTIF", 6) + 1;
    const notif: Notification = {
      notifId: `NOTIF-${pad(next, 6)}`,
      jobId: input.jobId,
      recipientCsId: input.recipientCsId,
      event: input.event,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      status: input.status ?? "sent",
      createdAt,
    };
    store.notifications.push(notif);
    return clone(notif);
  }

  async listNotifications(
    recipientCsId?: string,
    unreadOnly?: boolean,
  ): Promise<Notification[]> {
    let result = clone(store.notifications);
    if (recipientCsId) {
      result = result.filter((n) => n.recipientCsId === recipientCsId);
    }
    if (unreadOnly) {
      result = result.filter((n) => n.status !== "read");
    }
    return result;
  }

  async markNotificationRead(notifId: string): Promise<void> {
    const idx = store.notifications.findIndex((n) => n.notifId === notifId);
    if (idx === -1) return;
    const before = store.notifications[idx];
    if (!before) return;
    store.notifications[idx] = { ...before, status: "read", readAt: nowIso() };
  }

  // --- internal helpers ----------------------------------------------------

  private seedTemplateTodo(
    job: JobCard,
    template: Template,
    currentUser: CurrentUser,
  ): void {
    const createdAt = nowIso();
    const next = maxSeq(store.todos.map((t) => t.todoId), "TODO", 5) + 1;
    // Template deadlines are `deadlineOffsetHours` before the job deadline.
    const jobDeadlineMs = new Date(job.deadline).getTime();
    const offsetMs = template.deadlineOffsetHours * 60 * 60 * 1000;
    const todoDeadline = Number.isFinite(jobDeadlineMs)
      ? new Date(jobDeadlineMs - offsetMs).toISOString()
      : undefined;

    const todo: Todo = {
      todoId: `TODO-${pad(next, 5)}`,
      jobId: job.jobId,
      title: template.todoTitle,
      assignee: job.owner,
      status: "Not Started",
      deadline: todoDeadline,
      source: "Template",
      createdBy: currentUser.csId,
      createdAt,
    };
    store.todos.push(todo);

    appendLog({
      jobId: job.jobId,
      actor: currentUser.csId,
      timestamp: createdAt,
      event: "todo_added",
      field: "todoId",
      newValue: todo.todoId,
    });
  }
}
