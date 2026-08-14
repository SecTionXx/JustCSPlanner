// Scheduled scan — deadline reminders, overdue escalation, and waiting
// follow-up nudges. Scans all active (non-Completed) jobs, fires reminder
// notifications to the job owner, and escalates critical overdue jobs to
// team leads. Consumed by the /api/cron/scan route and the /admin/scan
// manual trigger.
//
// DESIGN NOTE on the chosen ActivityEvent:
// The ActivityEvent enum has no value that semantically fits "automated
// reminder." Rather than extend the shared enum (out of scope), we write
// directly via appendNotification with event: "note_added" — the same
// approach used by the daily summary (see summary.ts / summary/actions.ts).
// The subject line carries the real semantic meaning; "note_added" is the
// best-fit existing event for an informational in-app row.

import "server-only";

import { getRepository } from "../repository";
import { formatDateTime } from "../utils";
import type { JobCard, Notification } from "../types";

// --- Thresholds (named constants) ------------------------------------------

/** Send a first deadline reminder when this many hours remain. */
export const REMINDER_24H = 24;
/** Send an urgent deadline reminder when this many hours remain. */
export const REMINDER_4H = 4;
/** Escalate Critical jobs to leads once they are this many hours past deadline. */
export const ESCALATION_CRITICAL_HOURS = 2;
/** Nudge owner when a Waiting status has been stale for this long (since updatedAt). */
export const WAITING_FOLLOWUP_HOURS = 24;

// --- Dedup windows (hours before the same reminder can fire again) ----------

const DEDUP_24H_HOURS = 12;
const DEDUP_4H_HOURS = 3;
const DEDUP_OVERDUE_HOURS = 12;
const DEDUP_ESCALATION_HOURS = 6;
const DEDUP_FOLLOWUP_HOURS = 12;

// --- Subject markers (also serve as dedup keys via Notification.subject) ----

const SUBJECT_24H = "⏰ เตือน deadline ใน 24 ชม.";
const SUBJECT_4H = "⏰ เตือน deadline ใกล้แล้ว (4 ชม.)";
const SUBJECT_OVERDUE = "🚨 เลย deadline แล้ว";
const SUBJECT_ESCALATION = "🆘 งานวิกฤตเลยกำหนด — เลื่อนขึ้นผู้บริหาร";
const SUBJECT_FOLLOWUP = "⏳ ติดตามงานที่รอ";

// --- Types ------------------------------------------------------------------

export type ScanReminderType =
  | "reminder_24h"
  | "reminder_4h"
  | "overdue"
  | "escalation"
  | "follow_up";

export interface ScanSentEntry {
  type: ScanReminderType;
  jobId: string;
  recipientCsId: string;
}

export interface ScanResult {
  sent: ScanSentEntry[];
  skipped: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;

const WAITING_STATUSES = new Set(["Waiting Customer", "Waiting Docs"]);

// --- Helpers ----------------------------------------------------------------

/** Hours from now until the deadline (negative if past). NaN for invalid dates. */
function hoursUntilDeadline(deadline: string): number {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return Number.NaN;
  return (d.getTime() - Date.now()) / MS_PER_HOUR;
}

/** Hours since the given timestamp (NaN for invalid / future timestamps). */
function hoursSince(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.NaN;
  return (Date.now() - d.getTime()) / MS_PER_HOUR;
}

/**
 * Dedup guard — true when a notification with the exact `subject` for the
 * given `jobId` already exists for the recipient within `windowHours`.
 * Uses createdAt + subject + jobId to match, preventing duplicate spam.
 */
function alreadySent(
  notifs: Notification[],
  jobId: string,
  subject: string,
  windowHours: number,
): boolean {
  const cutoff = Date.now() - windowHours * MS_PER_HOUR;
  return notifs.some(
    (n) =>
      n.jobId === jobId &&
      n.subject === subject &&
      new Date(n.createdAt).getTime() >= cutoff,
  );
}

/** Build a human-readable Thai body for a deadline-related reminder. */
function buildDeadlineBody(
  job: JobCard,
  ownerName: string,
  note?: string,
): string {
  const lines: string[] = [];
  if (note) lines.push(note);
  lines.push(`ลูกค้า: ${job.customer}`);
  lines.push(`Job: ${job.jobId}`);
  lines.push(`กำหนด: ${formatDateTime(job.deadline)}`);
  lines.push(`สถานะ: ${job.status}`);
  lines.push(`ความสำคัญ: ${job.priority}`);
  lines.push(`เจ้าของ: ${ownerName}`);
  if (job.route) lines.push(`เส้นทาง: ${job.route}`);
  if (job.bookingNumber) lines.push(`Booking: ${job.bookingNumber}`);
  return lines.join("\n");
}

// --- Main scan --------------------------------------------------------------

/**
 * Scan all active jobs and fire deadline reminders, overdue escalation, and
 * waiting follow-up nudges. Never throws — per-job errors are caught and
 * logged so one bad row never aborts the whole scan.
 *
 * Dedup: before sending, checks the recipient's existing notifications for a
 * matching subject + jobId within the type-specific dedup window; skips if
 * already sent.
 */
export async function runScan(): Promise<ScanResult> {
  const repo = getRepository();
  const [jobs, team] = await Promise.all([
    repo.listJobs(),
    repo.listTeam(),
  ]);

  const nameByCsId = new Map<string, string>();
  for (const m of team) {
    nameByCsId.set(m.csId, m.displayName);
  }

  const leads = team.filter((m) => m.role === "lead" && m.active);
  const activeJobs = jobs.filter((j) => j.status !== "Completed");

  // Cache notifications per recipient to avoid N+1 queries across jobs.
  const notifCache = new Map<string, Notification[]>();
  async function getNotifs(csId: string): Promise<Notification[]> {
    let cached = notifCache.get(csId);
    if (!cached) {
      cached = await repo.listNotifications(csId);
      notifCache.set(csId, cached);
    }
    return cached;
  }

  const sent: ScanSentEntry[] = [];
  let skipped = 0;

  for (const job of activeJobs) {
    try {
      const hours = hoursUntilDeadline(job.deadline);
      const ownerName = nameByCsId.get(job.owner) ?? job.owner;
      const ownerNotifs = await getNotifs(job.owner);

      // --- Deadline reminders (guard against invalid deadline) ---
      if (!Number.isNaN(hours)) {
        // 24h reminder — fires when deadline is within REMINDER_24H and not yet past.
        if (hours >= 0 && hours <= REMINDER_24H) {
          if (
            alreadySent(ownerNotifs, job.jobId, SUBJECT_24H, DEDUP_24H_HOURS)
          ) {
            skipped += 1;
          } else {
            await repo.appendNotification({
              recipientCsId: job.owner,
              jobId: job.jobId,
              event: "note_added",
              channel: "in-app",
              subject: SUBJECT_24H,
              body: buildDeadlineBody(job, ownerName),
              status: "sent",
            });
            sent.push({
              type: "reminder_24h",
              jobId: job.jobId,
              recipientCsId: job.owner,
            });
          }
        }

        // 4h reminder — fires when deadline is within REMINDER_4H and not yet past.
        if (hours >= 0 && hours <= REMINDER_4H) {
          if (
            alreadySent(ownerNotifs, job.jobId, SUBJECT_4H, DEDUP_4H_HOURS)
          ) {
            skipped += 1;
          } else {
            await repo.appendNotification({
              recipientCsId: job.owner,
              jobId: job.jobId,
              event: "note_added",
              channel: "in-app",
              subject: SUBJECT_4H,
              body: buildDeadlineBody(job, ownerName),
              status: "sent",
            });
            sent.push({
              type: "reminder_4h",
              jobId: job.jobId,
              recipientCsId: job.owner,
            });
          }
        }

        // Overdue reminder + escalation — deadline has passed.
        if (hours < 0) {
          if (
            alreadySent(
              ownerNotifs,
              job.jobId,
              SUBJECT_OVERDUE,
              DEDUP_OVERDUE_HOURS,
            )
          ) {
            skipped += 1;
          } else {
            await repo.appendNotification({
              recipientCsId: job.owner,
              jobId: job.jobId,
              event: "note_added",
              channel: "in-app",
              subject: SUBJECT_OVERDUE,
              body: buildDeadlineBody(
                job,
                ownerName,
                "งานเลยกำหนดแล้ว — กรุณาตรวจสอบด่วน",
              ),
              status: "sent",
            });
            sent.push({
              type: "overdue",
              jobId: job.jobId,
              recipientCsId: job.owner,
            });
          }

          // Escalation: Critical priority + overdue beyond ESCALATION_CRITICAL_HOURS.
          if (
            job.priority === "Critical" &&
            Math.abs(hours) > ESCALATION_CRITICAL_HOURS
          ) {
            const escalationNote = `งานวิกฤตเลยกำหนดเกิน ${ESCALATION_CRITICAL_HOURS} ชม. — กรุณาตรวจสอบด่วน`;
            for (const lead of leads) {
              const leadNotifs = await getNotifs(lead.csId);
              if (
                alreadySent(
                  leadNotifs,
                  job.jobId,
                  SUBJECT_ESCALATION,
                  DEDUP_ESCALATION_HOURS,
                )
              ) {
                skipped += 1;
                continue;
              }
              await repo.appendNotification({
                recipientCsId: lead.csId,
                jobId: job.jobId,
                event: "note_added",
                channel: "in-app",
                subject: SUBJECT_ESCALATION,
                body: buildDeadlineBody(job, ownerName, escalationNote),
                status: "sent",
              });
              sent.push({
                type: "escalation",
                jobId: job.jobId,
                recipientCsId: lead.csId,
              });
            }
          }
        }
      }

      // --- Waiting follow-up ---
      if (WAITING_STATUSES.has(job.status)) {
        const staleHours = hoursSince(job.updatedAt);
        if (
          !Number.isNaN(staleHours) &&
          staleHours > WAITING_FOLLOWUP_HOURS
        ) {
          if (
            alreadySent(
              ownerNotifs,
              job.jobId,
              SUBJECT_FOLLOWUP,
              DEDUP_FOLLOWUP_HOURS,
            )
          ) {
            skipped += 1;
          } else {
            await repo.appendNotification({
              recipientCsId: job.owner,
              jobId: job.jobId,
              event: "note_added",
              channel: "in-app",
              subject: SUBJECT_FOLLOWUP,
              body: buildDeadlineBody(
                job,
                ownerName,
                `งานอยู่ในสถานะรอดำเนินการเกิน ${WAITING_FOLLOWUP_HOURS} ชม. — กรุณาติดตาม`,
              ),
              status: "sent",
            });
            sent.push({
              type: "follow_up",
              jobId: job.jobId,
              recipientCsId: job.owner,
            });
          }
        }
      }
    } catch (error) {
      // Never throw from scan — log and continue to the next job.
      if (process.env.NODE_ENV !== "production") {
        console.error(`[scan] error processing job ${job.jobId}`, error);
      }
    }
  }

  return { sent, skipped };
}
