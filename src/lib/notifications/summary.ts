// Daily summary compiler for the CS team lead. Builds a snapshot of overdue,
// due-today, blocked, and newly-created jobs plus a per-CS workload breakdown.
// Consumed by the /admin/summary dashboard, the daily cron route, and the test
// server action.

import "server-only";

import { getRepository } from "../repository";
import { formatDateTime, isOverdue, nowIso } from "../utils";
import type { JobCard, TeamMember } from "../types";

const BANGKOK_TZ = "Asia/Bangkok";

const DATE_ONLY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: BANGKOK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** A single job rendered in the summary lists. */
export interface SummaryJobItem {
  jobId: string;
  customer: string;
  owner: string;
  ownerName: string;
  status: string;
  deadline: string;
  route?: string;
  bookingNumber?: string;
}

/** Workload segment — structurally compatible with WorkloadBar's segments. */
export interface SummaryWorkloadSegment {
  key: "new" | "in_progress" | "done" | "overdue";
  value: number;
}

/** Per-CS workload snapshot. */
export interface CsWorkload {
  csId: string;
  displayName: string;
  active: number;
  overdue: number;
  dueToday: number;
  total: number;
  segments: SummaryWorkloadSegment[];
}

/** Roll-up counts for the KPI row. */
export interface SummaryCounts {
  totalActive: number;
  overdue: number;
  dueToday: number;
  blocked: number;
  new24h: number;
}

/** Full daily summary payload. */
export interface SummaryData {
  generatedAt: string;
  counts: SummaryCounts;
  overdue: SummaryJobItem[];
  dueToday: SummaryJobItem[];
  blocked: SummaryJobItem[];
  newSinceYesterday: SummaryJobItem[];
  workloads: CsWorkload[];
}

/** True when the ISO deadline falls on today's Bangkok calendar date. */
function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return DATE_ONLY_FMT.format(d) === DATE_ONLY_FMT.format(new Date());
}

/** True when the ISO timestamp is within the last `hours` from now (not future). */
function isWithinHours(iso: string, hours: number): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff < hours * 60 * 60 * 1000;
}

/** Map a JobCard to the summary list item shape. */
function toSummaryItem(
  job: JobCard,
  nameByCsId: Map<string, string>,
): SummaryJobItem {
  return {
    jobId: job.jobId,
    customer: job.customer,
    owner: job.owner,
    ownerName: nameByCsId.get(job.owner) ?? job.owner,
    status: job.status,
    deadline: job.deadline,
    route: job.route,
    bookingNumber: job.bookingNumber,
  };
}

/** Compute workload segments + counts for a single team member. */
function computeWorkload(
  member: TeamMember,
  jobs: JobCard[],
): CsWorkload {
  const owned = jobs.filter((j) => j.owner === member.csId);
  const counts = {
    new: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
  };

  for (const j of owned) {
    if (isOverdue(j)) counts.overdue += 1;
    else if (j.status === "New") counts.new += 1;
    else if (j.status === "Completed") counts.done += 1;
    else counts.in_progress += 1;
  }

  const segments: SummaryWorkloadSegment[] = [
    { key: "new", value: counts.new },
    { key: "in_progress", value: counts.in_progress },
    { key: "done", value: counts.done },
    { key: "overdue", value: counts.overdue },
  ];

  const active = owned.filter((j) => j.status !== "Completed").length;
  const dueToday = owned.filter(
    (j) => j.status !== "Completed" && isToday(j.deadline),
  ).length;

  return {
    csId: member.csId,
    displayName: member.displayName,
    active,
    overdue: counts.overdue,
    dueToday,
    total: owned.length,
    segments,
  };
}

/**
 * Compile the daily summary from the active repository. Fetches all jobs and
 * team members in parallel, then partitions jobs into overdue / due-today /
 * blocked / new-24h buckets and computes per-CS workload.
 */
export async function buildDailySummary(): Promise<SummaryData> {
  const repo = getRepository();
  const [jobs, team] = await Promise.all([
    repo.listJobs(),
    repo.listTeam(),
  ]);

  const nameByCsId = new Map<string, string>();
  for (const m of team) {
    nameByCsId.set(m.csId, m.displayName);
  }

  const activeJobs = jobs.filter((j) => j.status !== "Completed");
  const overdueJobs = jobs.filter((j) => isOverdue(j));
  const dueTodayJobs = activeJobs.filter((j) => isToday(j.deadline));
  const blockedJobs = activeJobs.filter(
    (j) => j.status === "Blocked" || j.status === "Needs Help",
  );
  const new24hJobs = jobs.filter((j) => isWithinHours(j.createdAt, 24));

  const workloads = team
    .filter((m) => m.active)
    .map((m) => computeWorkload(m, jobs));

  return {
    generatedAt: nowIso(),
    counts: {
      totalActive: activeJobs.length,
      overdue: overdueJobs.length,
      dueToday: dueTodayJobs.length,
      blocked: blockedJobs.length,
      new24h: new24hJobs.length,
    },
    overdue: overdueJobs.map((j) => toSummaryItem(j, nameByCsId)),
    dueToday: dueTodayJobs.map((j) => toSummaryItem(j, nameByCsId)),
    blocked: blockedJobs.map((j) => toSummaryItem(j, nameByCsId)),
    newSinceYesterday: new24hJobs.map((j) => toSummaryItem(j, nameByCsId)),
    workloads,
  };
}

/** Render a Thai plain-text version of the summary for email/in-app body. */
export function summaryToText(s: SummaryData): string {
  const lines: string[] = [];
  lines.push(`สรุปประจำวัน — ${formatDateTime(s.generatedAt)}`);
  lines.push("");
  lines.push(`งาน Active: ${s.counts.totalActive}`);
  lines.push(`เกินกำหนด: ${s.counts.overdue}`);
  lines.push(`Deadline วันนี้: ${s.counts.dueToday}`);
  lines.push(`ติดขัด/ต้องการความช่วยเหลือ: ${s.counts.blocked}`);
  lines.push(`งานใหม่ (24 ชม.): ${s.counts.new24h}`);

  const sections: { title: string; items: SummaryJobItem[] }[] = [
    { title: "งานเกินกำหนด", items: s.overdue },
    { title: "Deadline วันนี้", items: s.dueToday },
    { title: "ติดขัด/ต้องการความช่วยเหลือ", items: s.blocked },
    { title: "งานใหม่ใน 24 ชม.", items: s.newSinceYesterday },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;
    lines.push("");
    lines.push(`${section.title} (${section.items.length})`);
    for (const item of section.items) {
      const deadline = formatDateTime(item.deadline);
      const subtitle = [
        item.route,
        item.bookingNumber ?? item.jobId,
      ]
        .filter(Boolean)
        .join(" · ");
      const parts = [`- ${item.customer} (${subtitle})`];
      if (deadline) parts.push(`กำหนด ${deadline}`);
      parts.push(`เจ้าของ: ${item.ownerName}`);
      lines.push(parts.join(" — "));
    }
  }

  if (s.workloads.length > 0) {
    lines.push("");
    lines.push("ภาระงานตาม CS");
    for (const w of s.workloads) {
      lines.push(
        `${w.displayName}: ${w.active} active · ${w.overdue} overdue · ${w.dueToday} deadline วันนี้`,
      );
    }
  }

  return lines.join("\n");
}
