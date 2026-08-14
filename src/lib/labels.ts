// Thai display labels for English enums. Data layer keeps English values
// (they mirror the Google Sheet dropdowns) — this is presentation only.
// Token keys refer to CSS custom properties in src/app/globals.css.

import type {
  ActivityEvent,
  EmailInboxStatus,
  JobStatus,
  Priority,
  TodoStatus,
} from "@/lib/enums";

export const JOB_STATUS_TH: Record<JobStatus, string> = {
  New: "ใหม่",
  "In Progress": "กำลังดำเนินการ",
  "Waiting Customer": "รอลูกค้า",
  "Waiting Docs": "รอเอกสาร",
  Blocked: "ติดขัด",
  "Needs Help": "ต้องการช่วยเหลือ",
  Completed: "เสร็จสิ้น",
};

export const PRIORITY_TH: Record<Priority, string> = {
  Normal: "ปกติ",
  High: "ด่วน",
  Critical: "ด่วนมาก",
};

export const TODO_STATUS_TH: Record<TodoStatus, string> = {
  "Not Started": "ยังไม่เริ่ม",
  Doing: "กำลังทำ",
  Waiting: "รอ",
  Done: "เสร็จแล้ว",
};

export const EMAIL_STATUS_TH: Record<EmailInboxStatus, string> = {
  new: "ใหม่",
  linked: "เชื่อมโยงแล้ว",
  converted: "แปลงเป็นงานแล้ว",
  ignored: "ละเว้น",
};

/** Activity-log event → Thai label. */
export const ACTIVITY_EVENT_TH: Record<ActivityEvent, string> = {
  job_created: "สร้างงาน",
  job_closed: "ปิดงาน",
  status_changed: "เปลี่ยนสถานะ",
  owner_changed: "เปลี่ยนเจ้าของงาน",
  deadline_changed: "เปลี่ยนกำหนดส่ง",
  todo_added: "เพิ่ม To-do",
  todo_completed: "ทำ To-do เสร็จ",
  note_added: "เพิ่มความคิดเห็น",
  doc_added: "แนบเอกสาร",
};

/** Tailwind class pair per activity event (timeline dot / badge tone). */
export const ACTIVITY_EVENT_TONE: Record<ActivityEvent, string> = {
  job_created: "bg-status-new",
  job_closed: "bg-status-completed",
  status_changed: "bg-status-progress",
  owner_changed: "bg-status-waiting-docs",
  deadline_changed: "bg-status-needs-help",
  todo_added: "bg-status-waiting-customer",
  todo_completed: "bg-status-completed",
  note_added: "bg-status-waiting-customer",
  doc_added: "bg-status-waiting-docs",
};

/** Job status → Tailwind text/bg classes (single source for badge styling). */
export const JOB_STATUS_CLASSES: Record<JobStatus, string> = {
  New: "bg-status-new-soft text-status-new",
  "In Progress": "bg-status-progress-soft text-status-progress",
  "Waiting Customer": "bg-status-waiting-customer-soft text-status-waiting-customer",
  "Waiting Docs": "bg-status-waiting-docs-soft text-status-waiting-docs",
  Blocked: "bg-status-blocked-soft text-status-blocked",
  "Needs Help": "bg-status-needs-help-soft text-status-needs-help",
  Completed: "bg-status-completed-soft text-status-completed",
};

export const PRIORITY_CLASSES: Record<Priority, string> = {
  Normal: "bg-priority-normal-soft text-priority-normal",
  High: "bg-priority-high-soft text-priority-high",
  Critical: "bg-priority-critical-soft text-priority-critical",
};

export const TODO_STATUS_CLASSES: Record<TodoStatus, string> = {
  "Not Started": "bg-todo-not-started-soft text-todo-not-started",
  Doing: "bg-todo-doing-soft text-todo-doing",
  Waiting: "bg-todo-waiting-soft text-todo-waiting",
  Done: "bg-todo-done-soft text-todo-done",
};

/** Map any free-form status string to a known JobStatus; fallback provided. */
export function toJobStatus(status: string, fallback: JobStatus = "New"): JobStatus {
  const s = status.trim().toLowerCase();
  if (/(waiting customer|รอลูกค้า)/.test(s)) return "Waiting Customer";
  if (/(waiting docs|รอเอกสาร)/.test(s)) return "Waiting Docs";
  if (/(blocked|ติดขัด)/.test(s)) return "Blocked";
  if (/(needs help|ต้องการช่วยเหลือ|ขอความช่วยเหลือ)/.test(s)) return "Needs Help";
  if (/(completed|done|เสร็จ)/.test(s)) return "Completed";
  if (/(in progress|กำลังดำเนินการ)/.test(s)) return "In Progress";
  if (/(new|ใหม่)/.test(s)) return "New";
  return fallback;
}
