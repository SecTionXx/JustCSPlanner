// Permission policy — pure functions, no I/O.
// Canonical role→ability matrix. Every mutation in actions.ts MUST consult this
// module before touching the repository; the UI also gates on it for defense in
// depth. Keep these pure & unit-friendly.
//
// Roles: requester | cs_owner | cs_assistant | lead | admin
// "owner/backup" = user.csId === job.owner || user.csId === job.backup

import type { CurrentUser, JobCard } from "../types";

/** True if the user is the owner or the assigned backup of the job. */
export function isOwnerOrBackup(user: CurrentUser, job: JobCard): boolean {
  return user.csId === job.owner || user.csId === job.backup;
}

/** True if the user is the backup of the job. */
function isBackup(user: CurrentUser, job: JobCard): boolean {
  return user.csId === job.backup;
}

/**
 * Job-scoped mutation predicate shared by editJob, changeStatus, closeJob,
 * addTodo, toggleTodo, deleteTodo:
 *   requester ✗; cs_owner ✓ if owner/backup; cs_assistant ✓ if backup;
 *   lead/admin ✓ any.
 */
function canManageJob(user: CurrentUser, job: JobCard): boolean {
  switch (user.role) {
    case "requester":
      return false;
    case "cs_owner":
      return isOwnerOrBackup(user, job);
    case "cs_assistant":
      return isBackup(user, job);
    case "lead":
    case "admin":
      return true;
    default:
      return false;
  }
}

// --- Role-only abilities (job-independent) ---

/** All roles may create a job. */
export function canCreateJob(user: CurrentUser): boolean {
  void user;
  return true;
}

/** All roles may view a job. */
export function canViewJob(user: CurrentUser): boolean {
  void user;
  return true;
}

/** All roles may add a comment/note. */
export function canAddNote(user: CurrentUser): boolean {
  void user;
  return true;
}

/** Reassign (change owner) — lead and admin only. */
export function canReassign(user: CurrentUser): boolean {
  return user.role === "lead" || user.role === "admin";
}

/** Change deadline — lead and admin only. */
export function canChangeDeadline(user: CurrentUser): boolean {
  return user.role === "lead" || user.role === "admin";
}

/** View admin pages — lead and admin only. */
export function canViewAdmin(user: CurrentUser): boolean {
  return user.role === "lead" || user.role === "admin";
}

/** Manage team members — admin only. */
export function canManageTeam(user: CurrentUser): boolean {
  return user.role === "admin";
}

/** Manage templates — lead and admin only. */
export function canManageTemplates(user: CurrentUser): boolean {
  return user.role === "lead" || user.role === "admin";
}

// --- Job-scoped abilities ---

export function canEditJob(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}

export function canChangeStatus(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}

export function canCloseJob(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}

export function canAddTodo(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}

export function canToggleTodo(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}

export function canDeleteTodo(user: CurrentUser, job: JobCard): boolean {
  return canManageJob(user, job);
}
