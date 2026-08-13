import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { JobCard } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Date / ID helpers (server-safe; no DOM) -------------------------------

const BANGKOK_TZ = "Asia/Bangkok";

/** Current time as an ISO string with the Asia/Bangkok (+07:00) offset. */
export function nowIso(): string {
  // toLocaleString with timeZone gives us Bangkok wall time; we re-parse and
  // attach +07:00 so the stored value round-trips correctly regardless of the
  // server's own timezone.
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const iso = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.000+07:00`;
  return iso;
}

/**
 * Generate the next `JOB-YYYY-NNNN` id from existing ids. Scans for the max
 * sequence number in the current Bangkok year and increments.
 */
export function nextJobId(existing: string[]): string {
  const year = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BANGKOK_TZ,
      year: "numeric",
    }).format(new Date()),
  ).getFullYear();

  const re = new RegExp(`^JOB-${year}-(\\d{4})$`);
  let max = 0;
  for (const id of existing) {
    const m = id.match(re);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  const next = max + 1;
  return `JOB-${year}-${String(next).padStart(4, "0")}`;
}

const THAI_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  timeZone: BANGKOK_TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Thai-locale friendly formatting, e.g. "14 ส.ค. 2026 15:00".
 * Returns "" for empty/invalid input.
 */
export function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return THAI_DATE_FORMATTER.format(d);
}

/** Whole days from now until the given ISO deadline (negative if past). */
export function daysUntil(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  const ms = d.getTime() - Date.now();
  return Math.trunc(ms / (1000 * 60 * 60 * 24));
}

/** Deadline is in the past AND the job is not Completed. */
export function isOverdue(job: JobCard): boolean {
  if (job.status === "Completed") return false;
  const d = new Date(job.deadline);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/** Deadline is within `hours` (default 24h) from now AND not past AND not Completed. */
export function isNearDeadline(job: JobCard, hours = 24): boolean {
  if (job.status === "Completed") return false;
  const d = new Date(job.deadline);
  if (Number.isNaN(d.getTime())) return false;
  const ms = d.getTime() - Date.now();
  return ms >= 0 && ms <= hours * 60 * 60 * 1000;
}
