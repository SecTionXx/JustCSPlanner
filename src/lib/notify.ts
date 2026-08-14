// Notification dispatcher. notify() builds a default Thai subject/body for the
// event, then fans out to every registered channel (in-app always; email/LINE
// when configured). Never throws — per-channel errors are caught and logged.
//
// The default template here is minimal on purpose; a full event→message policy
// (who gets notified, richer copy) lands in P2.2.

import "server-only";

import type { ActivityEvent } from "./enums";
import { getChannels } from "./notifications/registry";
import type { DeliverInput } from "./notifications/types";

/** Event-specific context passed to notify(). `jobId` populates the notification row. */
export interface NotifyPayload {
  jobId?: string;
  customer?: string;
  /** Extra summary fields rendered into the default body. */
  details?: Record<string, string | number | boolean | null>;
}

/** Minimal Thai label per event, used for the default subject/body. */
const EVENT_LABELS: Partial<Record<ActivityEvent, string>> = {
  job_created: "สร้างงานใหม่",
  job_closed: "ปิดงาน",
  status_changed: "เปลี่ยนสถานะงาน",
  owner_changed: "เปลี่ยนเจ้าของงาน",
  deadline_changed: "เลื่อน Deadline",
  todo_added: "เพิ่ม To-do",
  todo_completed: "ทำ To-do เสร็จ",
  note_added: "เพิ่มคอมเมนต์",
  doc_added: "เพิ่มเอกสาร",
};

/** Build a default Thai subject + body for the event/payload. */
function buildMessage(
  event: ActivityEvent,
  payload: NotifyPayload,
): { subject: string; body: string } {
  const label = EVENT_LABELS[event] ?? event;
  const subject = `การแจ้งเตือน: ${label}`;
  const lines: string[] = [];
  if (payload.customer) lines.push(`ลูกค้า: ${payload.customer}`);
  if (payload.jobId) lines.push(`Job: ${payload.jobId}`);
  if (payload.details) {
    for (const [key, value] of Object.entries(payload.details)) {
      if (value !== null && value !== "") lines.push(`${key}: ${String(value)}`);
    }
  }
  const body = lines.join("\n");
  return { subject, body };
}

/**
 * Dispatch a notification for an activity event to all registered channels.
 * Iterates recipients × channels; each delivery is isolated so one failure
 * never blocks the others. Never throws.
 */
export async function notify(
  event: ActivityEvent,
  payload: NotifyPayload,
  recipients: string[],
): Promise<void> {
  if (recipients.length === 0) return;
  const channels = getChannels();
  const { subject, body } = buildMessage(event, payload);

  for (const recipientCsId of recipients) {
    const input: DeliverInput = {
      recipientCsId,
      event,
      subject,
      body,
      jobId: payload.jobId,
    };
    for (const channel of channels) {
      try {
        await channel.deliver(input);
      } catch (error) {
        // Defensive: deliver() already catches, but guard against unexpected throws.
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[notify] channel "${channel.key}" threw for ${recipientCsId}`,
            error,
          );
        }
      }
    }
  }
}
