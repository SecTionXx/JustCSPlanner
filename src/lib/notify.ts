// Notification dispatcher. notify() consults the notification policy
// (resolveNotification) for the subject/body (and recipients when omitted),
// then fans out to every registered channel (in-app always; email/LINE when
// configured). Never throws — per-channel errors are caught and logged.

import "server-only";

import type { ActivityEvent } from "./enums";
import type { JobCard } from "./types";
import { getChannels } from "./notifications/registry";
import {
  resolveNotification,
  type NotificationContext,
} from "./notifications/policy";
import type { DeliverInput } from "./notifications/types";

/**
 * Event-specific context passed to notify(). When `job` is present, notify()
 * consults the notification policy for recipients (when omitted), subject, body,
 * and the skip decision.
 */
export interface NotifyPayload {
  jobId?: string;
  customer?: string;
  /** The job the event concerns. Enables policy-driven subject/body/recipients. */
  job?: JobCard;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  /** csId of the acting user. */
  actor?: string;
  /** Resolved @mention csIds for note_added notifications. */
  extra?: { mentioned?: string[] };
  /** Legacy: extra summary fields rendered into the default body fallback. */
  details?: Record<string, string | number | boolean | null>;
}

/** Minimal Thai label per event, used for the default fallback subject/body. */
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

/** Build a default Thai subject + body fallback (used when no policy ctx). */
function buildFallbackMessage(
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
  return { subject, body: lines.join("\n") };
}

/** Build a NotificationContext from the payload, or null when no job is present. */
function buildContext(payload: NotifyPayload): NotificationContext | null {
  if (!payload.job) return null;
  return {
    job: payload.job,
    oldValue: payload.oldValue,
    newValue: payload.newValue,
    reason: payload.reason,
    actor: payload.actor,
    extra: payload.extra,
  };
}

/**
 * Dispatch a notification for an activity event to all registered channels.
 * When `payload.job` is present, notify() consults resolveNotification() for the
 * subject/body (and recipients when `recipients` is omitted). If the policy
 * returns null the event is skipped (e.g. todo_added, non-meaningful status
 * changes). Iterates recipients × channels; each delivery is isolated so one
 * failure never blocks the others. Never throws.
 */
export async function notify(
  event: ActivityEvent,
  payload: NotifyPayload,
  recipients?: string[],
): Promise<void> {
  const ctx = buildContext(payload);
  const decision = ctx ? resolveNotification(event, ctx) : null;

  // Policy said "do not notify" (e.g. todo_added, routine status change) → bail.
  if (ctx && !decision) return;

  const finalRecipients =
    recipients && recipients.length > 0
      ? recipients
      : (decision?.recipients ?? []);
  if (finalRecipients.length === 0) return;

  const { subject, body } = decision ?? buildFallbackMessage(event, payload);

  const channels = getChannels();
  for (const recipientCsId of finalRecipients) {
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
