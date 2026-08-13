// Domain types mirroring the Google Sheet schema. Field names are the Sheet
// column keys exactly (camelCase) so a future Sheets adapter maps 1:1.
// See docs/google-sheets-schema.md §1–§5.

import type {
  ActivityEvent,
  JobStatus,
  Priority,
  Role,
  ServiceType,
  ShipmentType,
  TodoSource,
  TodoStatus,
} from "./enums";

/** JobCards row — schema §1. */
export interface JobCard {
  jobId: string; // JOB-YYYY-NNNN
  customer: string;
  bookingNumber?: string;
  shipmentType: ShipmentType;
  serviceType: ServiceType;
  route?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  /** FK → TeamMember.csId. Exactly one owner (enforced in repository). */
  owner: string;
  /** FK → TeamMember.csId, optional. */
  backup?: string;
  status: JobStatus;
  priority: Priority;
  /** ISO 8601 with +07:00 offset. */
  deadline: string;
  cutoff?: string;
  etd?: string;
  eta?: string;
  latestSummary?: string;
  /** Doc URLs; stored in the Sheet as newline-joined string. */
  docLinks?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Todos row — schema §2. */
export interface Todo {
  todoId: string; // TODO-NNNNN
  jobId: string; // FK → JobCard.jobId
  title: string;
  /** FK → TeamMember.csId. */
  assignee: string;
  status: TodoStatus;
  deadline?: string;
  source: TodoSource;
  /** ISO string; empty while not Done. */
  completedAt?: string;
  createdBy: string;
  createdAt: string;
}

/** ActivityLog row — schema §3. Append-only. */
export interface ActivityLog {
  logId: string; // LOG-NNNNNN
  jobId: string; // FK → JobCard.jobId
  actor: string;
  timestamp: string;
  event: ActivityEvent;
  /** Which field changed (for *_changed events). */
  field?: string;
  oldValue?: string;
  newValue?: string;
  /** Reason — required for owner_changed and deadline_changed. */
  reason?: string;
  refLink?: string;
}

/** Team row — schema §4. */
export interface TeamMember {
  csId: string; // slug, lowercase
  displayName: string;
  role: Role;
  active: boolean;
  email?: string;
}

/** Templates row — schema §5. Seeds To-dos on job create. */
export interface Template {
  templateType: ServiceType;
  order: number;
  todoTitle: string;
  /** Hours before the job deadline at which this todo is due. */
  deadlineOffsetHours: number;
  notes?: string;
}

/** Current user — a view of TeamMember used by the auth seam. */
export type CurrentUser = Pick<TeamMember, "csId" | "displayName" | "role">;

/**
 * User-facing input for creating a job. Server-generated fields
 * (jobId, createdAt, updatedAt) are excluded; the repository fills them.
 */
export interface CreateJobInput {
  customer: string;
  bookingNumber?: string;
  shipmentType: ShipmentType;
  serviceType: ServiceType;
  route?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  owner: string;
  backup?: string;
  status?: JobStatus;
  priority: Priority;
  deadline: string;
  cutoff?: string;
  etd?: string;
  eta?: string;
  latestSummary?: string;
  docLinks?: string[];
}

/** Filters for listJobs. */
export interface JobFilter {
  owner?: string;
  status?: JobStatus;
  overdue?: boolean;
  /** Within N hours of deadline (see utils.isNearDeadline). */
  nearDeadline?: boolean;
  search?: string;
  serviceType?: ServiceType;
}

/** Patch shape for updateJob — a partial JobCard minus server-managed keys. */
export type JobPatch = Partial<
  Omit<JobCard, "jobId" | "createdBy" | "createdAt" | "updatedAt">
>;

/** Input for creating a todo (todoId/timestamps generated server-side). */
export interface CreateTodoInput {
  jobId: string;
  title: string;
  assignee: string;
  status?: TodoStatus;
  deadline?: string;
  source: TodoSource;
}

/** Patch shape for updateTodo. */
export type TodoPatch = Partial<
  Omit<Todo, "todoId" | "jobId" | "createdBy" | "createdAt">
>;
