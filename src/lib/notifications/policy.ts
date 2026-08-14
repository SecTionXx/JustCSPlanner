// Notification policy — the single source of truth for WHO gets notified for
// WHICH event, plus the Thai subject/body copy. Pure: no I/O, never throws.
// Design doc §10.
//
// resolveNotification() maps an (event, ctx) pair to a decision
// { recipients, subject, body } or null (skip). The notify() dispatcher calls
// this; repositories build the ctx at each event site.
//
// @mention support: repositories parse @tokens from note text and resolve them
// to csIds via listTeam() before calling notify; the resolved ids arrive in
// ctx.extra.mentioned. See extractMentionTokens / resolveMentionCsIds below.

import "server-only";

import type { ActivityEvent } from "../enums";
import type { JobCard, TeamMember } from "../types";

/** Context handed to resolveNotification(). `job` is the job in question; the
 *  optional oldValue/newValue/reason carry the change payload for *_changed
 *  events. `extra.mentioned` carries already-resolved csIds for @mentions. */
export interface NotificationContext {
  job: JobCard;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  /** csId of who performed the action (reserved for future template use). */
  actor?: string;
  extra?: { mentioned?: string[] };
}

/** A resolved notification decision: who to reach and what to say. */
export interface NotificationDecision {
  recipients: string[];
  subject: string;
  body: string;
}

/**
 * Statuses that warrant notifying the owner when a job transitions INTO them.
 * These represent attention-needed states (blocked, help required, waiting on
 * an external party). Transitions OUT of these (e.g. Blocked → In Progress) are
 * NOT notified, to keep the signal-to-noise ratio sane. Routine transitions
 * (New → In Progress) are skipped for the same reason. Completion is handled
 * separately via the job_closed event.
 */
const NEEDS_ATTENTION_STATUSES: ReadonlySet<string> = new Set([
  "Blocked",
  "Needs Help",
  "Waiting Customer",
  "Waiting Docs",
]);

/** Format an ISO timestamp as "YYYY-MM-DD HH:mm" (pure, no locale I/O). */
function fmtDate(iso?: string): string {
  if (!iso) return "—";
  // ISO is like "2026-08-14T15:00:00+07:00"; show the wall-clock part only.
  const datePart = iso.slice(0, 10);
  const timePart = iso.slice(11, 16);
  return timePart ? `${datePart} ${timePart}` : datePart;
}

function forJobCreated(ctx: NotificationContext): NotificationDecision {
  const { job } = ctx;
  const recipients = job.backup ? [job.owner, job.backup] : [job.owner];
  return {
    recipients,
    subject: `มีงานใหม่ได้รับมอบหมาย: ${job.jobId}`,
    body: `ลูกค้า ${job.customer}\nDeadline ${fmtDate(job.deadline)}`,
  };
}

function forOwnerChanged(ctx: NotificationContext): NotificationDecision {
  const { job, oldValue, newValue, reason } = ctx;
  const recipients: string[] = [];
  if (oldValue) recipients.push(oldValue);
  if (newValue) recipients.push(newValue);
  const reasonLine = reason ? `\nเหตุผล: ${reason}` : "";
  return {
    recipients,
    subject: `โอนย้ายเจ้าของงาน: ${job.jobId}`,
    body: `${job.customer}: ${oldValue ?? "?"} → ${newValue ?? "?"}${reasonLine}`,
  };
}

function forDeadlineChanged(ctx: NotificationContext): NotificationDecision {
  const { job, oldValue, newValue, reason } = ctx;
  const reasonLine = reason ? `\nเหตุผล: ${reason}` : "";
  return {
    recipients: [job.owner],
    subject: `เลื่อน Deadline: ${job.jobId}`,
    body: `${job.customer}: ${fmtDate(oldValue)} → ${fmtDate(newValue)}${reasonLine}`,
  };
}

function forStatusChanged(
  ctx: NotificationContext,
): NotificationDecision | null {
  const { job, oldValue, newValue } = ctx;
  // Only notify transitions INTO an attention-needed status.
  if (!newValue || !NEEDS_ATTENTION_STATUSES.has(newValue)) return null;
  return {
    recipients: [job.owner],
    subject: `สถานะงานเปลี่ยน: ${job.jobId}`,
    body: `${job.customer}: ${oldValue ?? "?"} → ${newValue}`,
  };
}

function forJobClosed(ctx: NotificationContext): NotificationDecision {
  const { job, oldValue } = ctx;
  return {
    recipients: [job.owner],
    subject: `ปิดงานเรียบร้อย: ${job.jobId}`,
    body: `${job.customer}: ${oldValue ?? "?"} → Completed`,
  };
}

function forNoteAdded(ctx: NotificationContext): NotificationDecision {
  const { job, newValue, extra } = ctx;
  const mentioned = extra?.mentioned ?? [];
  // Owner always; merge in mentioned without duplicating the owner.
  const recipients = mentioned.includes(job.owner)
    ? mentioned
    : [job.owner, ...mentioned];
  const snippet =
    newValue && newValue.length > 120
      ? `${newValue.slice(0, 120)}…`
      : (newValue ?? "");
  return {
    recipients,
    subject: `คอมเมนต์ใหม่: ${job.jobId}`,
    body: `${job.customer}: ${snippet}`,
  };
}

/**
 * Resolve the notification decision for an event. Returns null when the event
 * should NOT notify (todo_added, todo_completed, or a non-meaningful status
 * transition). Pure and never throws.
 */
export function resolveNotification(
  event: ActivityEvent,
  ctx: NotificationContext,
): NotificationDecision | null {
  try {
    switch (event) {
      case "job_created":
        return forJobCreated(ctx);
      case "owner_changed":
        return forOwnerChanged(ctx);
      case "deadline_changed":
        return forDeadlineChanged(ctx);
      case "status_changed":
        return forStatusChanged(ctx);
      case "job_closed":
        return forJobClosed(ctx);
      case "note_added":
        return forNoteAdded(ctx);
      case "todo_added":
      case "todo_completed":
        // Too noisy — skip notification entirely.
        return null;
      default:
        return null;
    }
  } catch {
    // Defensive: never let a template bug suppress the event pipeline.
    return null;
  }
}

// --- @mention helpers -----------------------------------------------------

/** Matches "@token" where token is non-whitespace and free of common trailing
 *  punctuation. Captures the token WITHOUT the leading "@". */
const MENTION_RE = /@[^\s@.,;:!?'")\]]+/g;

/** Extract unique @mention tokens from text (without the leading "@"). */
export function extractMentionTokens(text: string): string[] {
  const matches = text.match(MENTION_RE);
  if (!matches) return [];
  const tokens = matches.map((m) => m.slice(1));
  return [...new Set(tokens)];
}

/**
 * Resolve mention tokens to csIds via the team roster. Matches displayName OR
 * csId, case-insensitive, trimmed. Unmatched tokens are silently dropped.
 */
export function resolveMentionCsIds(
  tokens: string[],
  team: TeamMember[],
): string[] {
  const resolved: string[] = [];
  for (const token of tokens) {
    const t = token.trim().toLowerCase();
    if (!t) continue;
    const match = team.find(
      (m) =>
        m.csId.trim().toLowerCase() === t ||
        m.displayName.trim().toLowerCase() === t,
    );
    if (match && !resolved.includes(match.csId)) {
      resolved.push(match.csId);
    }
  }
  return resolved;
}
