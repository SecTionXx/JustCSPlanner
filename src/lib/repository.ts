// Repository seam — the interface the rest of the app depends on.
// Pages and server actions consume `getRepository()`; the concrete backend
// (mock now, Google Sheets later) is chosen via the DATA_BACKEND env var.

import {
  MockJobRepository,
} from "./mock/repository";
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
} from "./types";

/**
 * Optional second argument to updateJob. Some changes (owner / deadline) require
 * a human reason that is captured in the ActivityLog row.
 */
export interface UpdateJobOptions {
  reason?: string;
}

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
  listActivity(jobId: string): Promise<ActivityLog[]>;
  listTeam(): Promise<TeamMember[]>;
  listTemplates(type?: Template["templateType"]): Promise<Template[]>;
}

export type DataBackend = "mock" | "sheets";

function resolveBackend(): DataBackend {
  const raw = (process.env.DATA_BACKEND ?? "mock") as DataBackend;
  return raw === "sheets" ? "sheets" : "mock";
}

/**
 * Factory for the active JobRepository. Currently always returns the mock; the
 * Google Sheets adapter is a later round and will branch on "sheets".
 */
export function getRepository(): JobRepository {
  const backend = resolveBackend();
  if (backend === "sheets") {
    // TODO(sheets-adapter): return SheetsJobRepository once implemented.
    // Intentionally falls through to mock until the adapter exists.
  }
  return new MockJobRepository();
}
