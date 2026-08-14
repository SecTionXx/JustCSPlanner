// Repository seam — the interface the rest of the app depends on.
// Pages and server actions consume `getRepository()`; the concrete backend
// (mock now, Google Sheets later) is chosen via the DATA_BACKEND env var.

import type { Role, ServiceType } from "./enums";
import {
  MockJobRepository,
} from "./mock/repository";
import { SheetsJobRepository } from "./sheets/google-sheets-repository";
import type {
  ActivityLog,
  CreateEmailInput,
  CreateJobInput,
  CreateNotificationInput,
  CreateTodoInput,
  CurrentUser,
  EmailInbox,
  EmailPatch,
  JobCard,
  JobFilter,
  JobPatch,
  Notification,
  Template,
  TeamMember,
  Todo,
  TodoPatch,
} from "./types";

/**
 * Optional second argument to updateJob. Some changes (owner / deadline) require
 * a human reason that is captured in the ActivityLog row.
 */
export interface UpdateJobOptions {
  reason?: string;
}

/** Input for creating a TeamMember. csId is derived when omitted. */
export interface CreateTeamMemberInput {
  csId?: string;
  displayName: string;
  role: Role;
  email?: string;
}

/** Patch shape for updateTeamMember. active:false deactivates a member. */
export type TeamMemberPatch = Partial<
  Pick<TeamMember, "displayName" | "role" | "email" | "active">
>;

/** Input for creating a Template row. PK is templateType + order. */
export interface CreateTemplateInput {
  templateType: ServiceType;
  order: number;
  todoTitle: string;
  deadlineOffsetHours: number;
  notes?: string;
}

/** Patch shape for updateTemplate. PK columns cannot be patched. */
export type TemplatePatch = Partial<
  Pick<Template, "todoTitle" | "deadlineOffsetHours" | "notes">
>;

export interface JobRepository {
  listJobs(filter?: JobFilter): Promise<JobCard[]>;
  getJob(jobId: string): Promise<JobCard | null>;
  createJob(input: CreateJobInput, currentUser: CurrentUser): Promise<JobCard>;
  updateJob(
    jobId: string,
    patch: JobPatch,
    currentUser: CurrentUser,
    options?: UpdateJobOptions,
  ): Promise<JobCard>;
  listTodos(jobId: string): Promise<Todo[]>;
  createTodo(input: CreateTodoInput, currentUser: CurrentUser): Promise<Todo>;
  updateTodo(
    todoId: string,
    patch: TodoPatch,
    currentUser: CurrentUser,
  ): Promise<Todo>;
  /** Remove a todo. No activity log required. */
  deleteTodo(todoId: string): Promise<void>;
  /**
   * Append a note/comment as an ActivityLog row (event: "note_added") and
   * return the created log entry. Reuses the existing ActivityLog tab — no
   * new sheet or column.
   */
  addNote(jobId: string, text: string, currentUser: CurrentUser): Promise<ActivityLog>;
  listActivity(jobId: string): Promise<ActivityLog[]>;
  listTeam(): Promise<TeamMember[]>;
  listTemplates(type?: Template["templateType"]): Promise<Template[]>;
  /**
   * Append a TeamMember. When `input.csId` is omitted, a slug is derived from
   * `displayName` (lowercase ascii, falling back to `member-NN` for non-ascii
   * names like Thai). `active` defaults to TRUE.
   */
  createTeamMember(
    input: CreateTeamMemberInput,
    currentUser: CurrentUser,
  ): Promise<TeamMember>;
  /** Find a member by csId and apply the patch. Throws if not found. */
  updateTeamMember(
    csId: string,
    patch: TeamMemberPatch,
    currentUser: CurrentUser,
  ): Promise<TeamMember>;
  /** Append a Template row. PK is templateType + order. */
  createTemplate(
    input: CreateTemplateInput,
    currentUser: CurrentUser,
  ): Promise<Template>;
  /** Patch a Template by its composite PK (templateType + order). Throws if missing. */
  updateTemplate(
    templateType: Template["templateType"],
    order: number,
    patch: TemplatePatch,
    currentUser: CurrentUser,
  ): Promise<Template>;
  /** Delete a Template by its composite PK (templateType + order). No-op if missing. */
  deleteTemplate(
    templateType: Template["templateType"],
    order: number,
    currentUser: CurrentUser,
  ): Promise<void>;
  /**
   * Append a Notification row (append-only). The notifId and createdAt are
   * generated server-side. Used by the in-app channel via getRepository().
   */
  appendNotification(input: CreateNotificationInput): Promise<Notification>;
  /**
   * List notifications. When `recipientCsId` is given, only that user's rows are
   * returned. When `unreadOnly` is true, only rows whose status is not "read".
   */
  listNotifications(recipientCsId?: string, unreadOnly?: boolean): Promise<Notification[]>;
  /** Set a notification's status to "read" and stamp readAt. No-op if missing. */
  markNotificationRead(notifId: string): Promise<void>;
  /**
   * List staged inbound emails. When `status` is given, only rows with that
   * status are returned.
   */
  listEmails(status?: EmailInbox["status"]): Promise<EmailInbox[]>;
  /**
   * Append an inbound email to the staging area (paste or webhook). The
   * emailId, receivedAt and the initial status "new" are generated server-side.
   */
  appendEmail(input: CreateEmailInput): Promise<EmailInbox>;
  /**
   * Patch an email's handling columns (status / matchedJobId / handledBy /
   * handledAt). Throws if the email is not found.
   */
  updateEmailStatus(
    emailId: string,
    patch: EmailPatch,
    currentUser: CurrentUser,
  ): Promise<void>;
}

export type DataBackend = "mock" | "sheets";

function resolveBackend(): DataBackend {
  const raw = (process.env.DATA_BACKEND ?? "mock") as DataBackend;
  return raw === "sheets" ? "sheets" : "mock";
}

/**
 * Factory for the active JobRepository. The backend is chosen via DATA_BACKEND:
 * "sheets" → Google Sheet adapter, anything else → in-memory mock.
 */
export function getRepository(): JobRepository {
  const backend = resolveBackend();
  if (backend === "sheets") {
    return new SheetsJobRepository();
  }
  return new MockJobRepository();
}
