// Enum definitions — values MUST match docs/google-sheets-schema.md §6 exactly.
// These string unions back the Google Sheet dropdowns, so do not rename values.

/** JobCards.status — schema §6 */
export const JOB_STATUSES = [
  "New",
  "In Progress",
  "Waiting Customer",
  "Waiting Docs",
  "Blocked",
  "Needs Help",
  "Completed",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Active job statuses (excludes Completed). */
export const ACTIVE_JOB_STATUSES = JOB_STATUSES.filter(
  (s): s is Exclude<JobStatus, "Completed"> => s !== "Completed",
);

/** Todos.status — schema §6 */
export const TODO_STATUSES = [
  "Not Started",
  "Doing",
  "Waiting",
  "Done",
] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

/** JobCards.priority — schema §1 (M) */
export const PRIORITIES = ["Normal", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** JobCards.shipmentType — schema §1 (D) */
export const SHIPMENT_TYPES = ["FCL", "LCL", "Air"] as const;
export type ShipmentType = (typeof SHIPMENT_TYPES)[number];

/** JobCards.serviceType / Templates.templateType — schema §1 (E), §5 (A) */
export const SERVICE_TYPES = ["Export Sea", "Import Sea", "Air Freight"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** Team.role — schema §4 (C) */
export const ROLES = [
  "requester",
  "cs_owner",
  "cs_assistant",
  "lead",
  "admin",
] as const;
export type Role = (typeof ROLES)[number];

/** ActivityLog.event — schema §6 */
export const ACTIVITY_EVENTS = [
  "job_created",
  "job_closed",
  "status_changed",
  "owner_changed",
  "deadline_changed",
  "todo_added",
  "todo_completed",
  "note_added",
  "doc_added",
] as const;
export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];

/** Todos.source — schema §2 (G) */
export const TODO_SOURCES = ["Template", "Assigned", "AI draft"] as const;
export type TodoSource = (typeof TODO_SOURCES)[number];

/** Notifications.status — schema §6 */
export const NOTIFICATION_STATUSES = ["sent", "failed", "read"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Notifications.channel — schema §6 */
export const NOTIFICATION_CHANNELS = ["in-app", "email", "line"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** EmailInbox.source — schema §6 */
export const EMAIL_SOURCES = ["paste", "webhook"] as const;
export type EmailSource = (typeof EMAIL_SOURCES)[number];

/** EmailInbox.status — schema §6 */
export const EMAIL_INBOX_STATUSES = ["new", "linked", "converted", "ignored"] as const;
export type EmailInboxStatus = (typeof EMAIL_INBOX_STATUSES)[number];
