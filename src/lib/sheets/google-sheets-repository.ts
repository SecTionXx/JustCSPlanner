// Google Sheets JobRepository adapter.
// Implements the same JobRepository interface as the mock, persisting to the
// Google Sheet whose structure is created by scripts/seed-sheet.mjs
// (tabs: JobCards / Todos / ActivityLog / Team / Templates; row 1 = headers).
//
// All access is server-side via the service account referenced by
// GOOGLE_APPLICATION_CREDENTIALS. Pages/actions never touch this directly —
// they go through getRepository() in ../repository.ts.

import { google } from "googleapis";
import type { ActivityEvent } from "../enums";
import type {
  ActivityLog,
  CreateJobInput,
  CreateTodoInput,
  CurrentUser,
  JobCard,
  JobFilter,
  JobPatch,
  Template,
  TeamMember,
  Todo,
  TodoPatch,
} from "../types";
import type { JobRepository, UpdateJobOptions } from "../repository";
import { notify } from "../notify";
import { isNearDeadline, isOverdue, nextJobId, nowIso } from "../utils";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "";
const KEYFILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!SPREADSHEET_ID) {
  throw new Error(
    "GOOGLE_SHEETS_SPREADSHEET_ID is not set. Add it to .env.local (DATA_BACKEND=sheets).",
  );
}

// Header orders MUST match scripts/seed-sheet.mjs and docs/google-sheets-schema.md.
const HEADERS = {
  JobCards: [
    "jobId", "customer", "bookingNumber", "shipmentType", "serviceType",
    "route", "origin", "destination", "carrier", "owner", "backup", "status",
    "priority", "deadline", "cutoff", "etd", "eta", "latestSummary",
    "docLinks", "createdBy", "createdAt", "updatedAt",
  ],
  Todos: [
    "todoId", "jobId", "title", "assignee", "status", "deadline", "source",
    "completedAt", "createdBy", "createdAt",
  ],
  ActivityLog: [
    "logId", "jobId", "actor", "timestamp", "event", "field", "oldValue",
    "newValue", "reason", "refLink",
  ],
  Team: ["csId", "displayName", "role", "active", "email"],
  Templates: ["templateType", "order", "todoTitle", "deadlineOffsetHours", "notes"],
} as const;

type TabName = keyof typeof HEADERS;
type Row = Record<string, string>;

// Expose each tab's headers as a plain string[] for dynamic indexing/lookups.
const HEADERS_LIST: Record<TabName, readonly string[]> = HEADERS;

// Single shared, lazily-built client.
let _sheets: ReturnType<typeof google.sheets> | null = null;
function client() {
  if (!_sheets) {
    const auth = new google.auth.GoogleAuth({
      keyFilename: KEYFILE,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    _sheets = google.sheets({ version: "v4", auth });
  }
  return _sheets;
}

// --- low-level helpers ---------------------------------------------------

/** Read a tab into objects keyed by header name. Skips the header row. */
async function readTab(tab: TabName): Promise<Row[]> {
  const headers = HEADERS_LIST[tab];
  const res = await client().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A2:Z`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r) => {
      const obj: Row = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] != null ? String(r[i]) : "";
      });
      return obj;
    });
}

/** Append a single row (RAW so our ISO strings / values stay intact). */
async function appendRow(tab: TabName, values: string[]): Promise<void> {
  await client().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

/** Overwrite one row at an absolute row number (1-indexed, includes header). */
async function writeRow(tab: TabName, rowNumber: number, values: string[]): Promise<void> {
  const lastCol = String.fromCharCode(64 + HEADERS_LIST[tab].length); // A..J etc.
  await client().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

/** Find the 1-indexed sheet row number (incl. header) of the first row whose
 *  `key` column equals `value`. Returns -1 if not found. */
async function findRowNumber(tab: TabName, key: string, value: string): Promise<number> {
  const headers = HEADERS_LIST[tab];
  const res = await client().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A2:Z`,
  });
  const rows = res.data.values ?? [];
  const colIdx = headers.indexOf(key);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]?.[colIdx] ?? "") === value) return i + 2; // +2: header + 1-index
  }
  return -1;
}

/** Lazily-built title → sheetId (gid) map from spreadsheets.get. */
let _sheetIdCache: Record<string, number> | null = null;
async function getSheetId(tab: TabName): Promise<number> {
  if (!_sheetIdCache) {
    const res = await client().spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const map: Record<string, number> = {};
    for (const sheet of res.data.sheets ?? []) {
      const title = sheet.properties?.title;
      const id = sheet.properties?.sheetId;
      if (title && typeof id === "number") map[title] = id;
    }
    _sheetIdCache = map;
  }
  const id = _sheetIdCache[tab];
  if (typeof id !== "number") throw new Error(`Sheet tab not found: ${tab}`);
  return id;
}

/**
 * Delete the first row whose `key` column equals `value` via batchUpdate
 * (deleteDimension). No-op if the row is not found.
 */
async function deleteRowByValue(tab: TabName, key: string, value: string): Promise<void> {
  const rowNumber = await findRowNumber(tab, key, value);
  if (rowNumber === -1) return;
  const sheetId = await getSheetId(tab);
  // findRowNumber is 1-indexed (incl. header); batchUpdate ranges are 0-indexed.
  const startIndex = rowNumber - 1;
  await client().spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex,
              endIndex: startIndex + 1,
            },
          },
        },
      ],
    },
  });
}

function serialize(tab: TabName, obj: object): string[] {
  const o = obj as Record<string, unknown>;
  return HEADERS_LIST[tab].map((h) => {
    const v = o[h];
    if (v == null) return "";
    if (Array.isArray(v)) return (v as string[]).join("\n");
    return String(v);
  });
}

// --- ID sequencing -------------------------------------------------------

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
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

// --- row ↔ object mappers ------------------------------------------------

function toJob(r: Row): JobCard {
  return {
    jobId: r.jobId,
    customer: r.customer,
    bookingNumber: r.bookingNumber || undefined,
    shipmentType: r.shipmentType as JobCard["shipmentType"],
    serviceType: r.serviceType as JobCard["serviceType"],
    route: r.route || undefined,
    origin: r.origin || undefined,
    destination: r.destination || undefined,
    carrier: r.carrier || undefined,
    owner: r.owner,
    backup: r.backup || undefined,
    status: r.status as JobCard["status"],
    priority: r.priority as JobCard["priority"],
    deadline: r.deadline,
    cutoff: r.cutoff || undefined,
    etd: r.etd || undefined,
    eta: r.eta || undefined,
    latestSummary: r.latestSummary || undefined,
    docLinks: r.docLinks ? r.docLinks.split("\n").filter(Boolean) : undefined,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
function toTodo(r: Row): Todo {
  return {
    todoId: r.todoId,
    jobId: r.jobId,
    title: r.title,
    assignee: r.assignee,
    status: r.status as Todo["status"],
    deadline: r.deadline || undefined,
    source: r.source as Todo["source"],
    completedAt: r.completedAt || undefined,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
  };
}
function toActivity(r: Row): ActivityLog {
  return {
    logId: r.logId,
    jobId: r.jobId,
    actor: r.actor,
    timestamp: r.timestamp,
    event: r.event as ActivityEvent,
    field: r.field || undefined,
    oldValue: r.oldValue || undefined,
    newValue: r.newValue || undefined,
    reason: r.reason || undefined,
    refLink: r.refLink || undefined,
  };
}
function toTeam(r: Row): TeamMember {
  return {
    csId: r.csId,
    displayName: r.displayName,
    role: r.role as TeamMember["role"],
    active: r.active.toUpperCase() === "TRUE",
    email: r.email || undefined,
  };
}
function toTemplate(r: Row): Template {
  return {
    templateType: r.templateType as Template["templateType"],
    order: Number(r.order) || 0,
    todoTitle: r.todoTitle,
    deadlineOffsetHours: Number(r.deadlineOffsetHours) || 0,
    notes: r.notes || undefined,
  };
}

// --- the repository ------------------------------------------------------

export class SheetsJobRepository implements JobRepository {
  async listJobs(filter?: JobFilter): Promise<JobCard[]> {
    let result = (await readTab("JobCards")).map(toJob);
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
    const found = (await readTab("JobCards")).map(toJob).find((j) => j.jobId === jobId);
    return found ?? null;
  }

  async createJob(input: CreateJobInput, currentUser: CurrentUser): Promise<JobCard> {
    const existing = (await readTab("JobCards")).map((r) => r.jobId);
    const createdAt = nowIso();
    const jobId = nextJobId(existing);

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
    await appendRow("JobCards", serialize("JobCards", job));

    await this.appendLog({
      jobId,
      actor: currentUser.csId,
      timestamp: createdAt,
      event: "job_created",
    });

    // Seed template To-dos when a matching template exists.
    const templates = (await readTab("Templates"))
      .map(toTemplate)
      .filter((t) => t.templateType === job.serviceType)
      .sort((a, b) => a.order - b.order);
    for (const t of templates) {
      await this.seedTemplateTodo(job, t, currentUser);
    }

    notify("job_created", { jobId, customer: job.customer });
    return job;
  }

  async updateJob(
    jobId: string,
    patch: JobPatch,
    currentUser: CurrentUser,
    options?: UpdateJobOptions,
  ): Promise<JobCard> {
    const rowNumber = await findRowNumber("JobCards", "jobId", jobId);
    if (rowNumber === -1) throw new Error(`Job not found: ${jobId}`);

    const before = (await readTab("JobCards")).map(toJob).find((j) => j.jobId === jobId);
    if (!before) throw new Error(`Job not found: ${jobId}`);

    const timestamp = nowIso();
    const statusChanged = patch.status !== undefined && patch.status !== before.status;
    const ownerChanged = patch.owner !== undefined && patch.owner !== before.owner;
    const deadlineChanged = patch.deadline !== undefined && patch.deadline !== before.deadline;

    if (ownerChanged && !options?.reason) throw new Error("owner_changed requires a reason");
    if (deadlineChanged && !options?.reason)
      throw new Error("deadline_changed requires a reason");
    if ("owner" in patch && patch.owner !== undefined && patch.owner.trim() === "")
      throw new Error("owner must be exactly one team member");

    const updated: JobCard = { ...before, ...patch, updatedAt: timestamp };
    await writeRow("JobCards", rowNumber, serialize("JobCards", updated));

    const actor = currentUser.csId;
    if (statusChanged && patch.status !== undefined) {
      const event: ActivityEvent = patch.status === "Completed" ? "job_closed" : "status_changed";
      await this.appendLog({
        jobId, actor, timestamp, event, field: "status",
        oldValue: before.status, newValue: patch.status, reason: options?.reason,
      });
    }
    if (ownerChanged && patch.owner !== undefined) {
      await this.appendLog({
        jobId, actor, timestamp, event: "owner_changed", field: "owner",
        oldValue: before.owner, newValue: patch.owner, reason: options?.reason,
      });
    }
    if (deadlineChanged) {
      await this.appendLog({
        jobId, actor, timestamp, event: "deadline_changed", field: "deadline",
        oldValue: before.deadline, newValue: patch.deadline, reason: options?.reason,
      });
    }
    return updated;
  }

  async listTodos(jobId: string): Promise<Todo[]> {
    return (await readTab("Todos")).map(toTodo).filter((t) => t.jobId === jobId);
  }

  async createTodo(input: CreateTodoInput, currentUser: CurrentUser): Promise<Todo> {
    const createdAt = nowIso();
    const existing = (await readTab("Todos")).map((r) => r.todoId);
    const next = maxSeq(existing, "TODO", 5) + 1;
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
    await appendRow("Todos", serialize("Todos", todo));
    await this.appendLog({
      jobId: input.jobId, actor: currentUser.csId, timestamp: createdAt,
      event: "todo_added", field: "todoId", newValue: todo.todoId,
    });
    return todo;
  }

  async updateTodo(
    todoId: string,
    patch: TodoPatch,
    currentUser: CurrentUser,
  ): Promise<Todo> {
    const rowNumber = await findRowNumber("Todos", "todoId", todoId);
    if (rowNumber === -1) throw new Error(`Todo not found: ${todoId}`);
    const before = (await readTab("Todos")).map(toTodo).find((t) => t.todoId === todoId);
    if (!before) throw new Error(`Todo not found: ${todoId}`);

    const timestamp = nowIso();
    const becameDone = patch.status === "Done" && before.status !== "Done";
    const updated: Todo = { ...before, ...patch };
    if (becameDone && !updated.completedAt) updated.completedAt = timestamp;
    await writeRow("Todos", rowNumber, serialize("Todos", updated));

    if (becameDone) {
      await this.appendLog({
        jobId: before.jobId, actor: currentUser.csId, timestamp,
        event: "todo_completed", field: "todoId",
        oldValue: before.status, newValue: "Done",
      });
    }
    return updated;
  }

  async deleteTodo(todoId: string): Promise<void> {
    await deleteRowByValue("Todos", "todoId", todoId);
  }

  async addNote(jobId: string, text: string, currentUser: CurrentUser): Promise<ActivityLog> {
    return this.appendLog({
      jobId,
      actor: currentUser.csId,
      timestamp: nowIso(),
      event: "note_added",
      field: "note",
      newValue: text,
    });
  }

  async listActivity(jobId: string): Promise<ActivityLog[]> {
    return (await readTab("ActivityLog")).map(toActivity).filter((a) => a.jobId === jobId);
  }

  async listTeam(): Promise<TeamMember[]> {
    return (await readTab("Team")).map(toTeam);
  }

  async listTemplates(type?: Template["templateType"]): Promise<Template[]> {
    const all = (await readTab("Templates")).map(toTemplate);
    return type ? all.filter((t) => t.templateType === type) : all;
  }

  // --- internal ----------------------------------------------------------

  private async appendLog(entry: Omit<ActivityLog, "logId">): Promise<ActivityLog> {
    const existing = (await readTab("ActivityLog")).map((r) => r.logId);
    const next = maxSeq(existing, "LOG", 6) + 1;
    const log: ActivityLog = { ...entry, logId: `LOG-${pad(next, 6)}` };
    await appendRow("ActivityLog", serialize("ActivityLog", log));
    return log;
  }

  private async seedTemplateTodo(
    job: JobCard,
    template: Template,
    currentUser: CurrentUser,
  ): Promise<void> {
    const createdAt = nowIso();
    const existing = (await readTab("Todos")).map((r) => r.todoId);
    const next = maxSeq(existing, "TODO", 5) + 1;
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
    await appendRow("Todos", serialize("Todos", todo));
    await this.appendLog({
      jobId: job.jobId, actor: currentUser.csId, timestamp: createdAt,
      event: "todo_added", field: "todoId", newValue: todo.todoId,
    });
  }
}
