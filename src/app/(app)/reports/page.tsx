import Link from "next/link";

import {
  KpiCard,
  PersonaAvatar,
  WorkloadBar,
  WorkloadLegend,
  type WorkloadKey,
  type WorkloadSegment,
} from "@/components/shell";
import { canViewAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  ACTIVE_JOB_STATUSES,
  SERVICE_TYPES,
  SHIPMENT_TYPES,
  type JobStatus,
} from "@/lib/enums";
import { getRepository } from "@/lib/repository";
import type { ActivityLog, JobCard, TeamMember } from "@/lib/types";
import { cn, isNearDeadline, isOverdue } from "@/lib/utils";

import { PageHeader, Panel } from "../_components/field";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_OPTIONS = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseDays(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isFinite(n) && (DAY_OPTIONS as readonly number[]).includes(n)) {
    return n;
  }
  return DEFAULT_DAYS;
}

// --- Local metric types (not added to shared types.ts) ---

interface StatusBucket {
  status: JobStatus;
  label: string;
  count: number;
  tone: string;
}

interface TypeBucket {
  label: string;
  count: number;
}

interface WorkloadEntry {
  member: TeamMember;
  segments: WorkloadSegment[];
  total: number;
  active: number;
}

// --- Localized labels & tones ---

const STATUS_LABELS: Record<JobStatus, string> = {
  New: "New",
  "In Progress": "In Progress",
  "Waiting Customer": "รอลูกค้า",
  "Waiting Docs": "รอเอกสาร",
  Blocked: "ติด/Blocked",
  "Needs Help": "ต้องการช่วยเหลือ",
  Completed: "เสร็จแล้ว",
};

const STATUS_TONES: Record<JobStatus, string> = {
  New: "#b6a2f4",
  "In Progress": "#53c99b",
  "Waiting Customer": "#fb923c",
  "Waiting Docs": "#e0a800",
  Blocked: "#c43850",
  "Needs Help": "#7050d6",
  Completed: "#9fd9f5",
};

// --- Pure computation helpers ---

/** Cutoff timestamp (ms) for the start of the analysis window — `days` ago. */
function rangeCutoff(days: number): number {
  return Date.now() - days * DAY_MS;
}

/** Format a millisecond duration as a compact Thai string (e.g. "2.3 ชม."). */
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.round(ms / (1000 * 60));
  if (minutes < 60) return `${minutes} นาที`;
  const hours = ms / (1000 * 60 * 60);
  if (hours < 48) return `${hours.toFixed(1)} ชม.`;
  const days = hours / 24;
  return `${days.toFixed(1)} วัน`;
}

/** Arithmetic mean, or null for an empty list (avoids divide-by-zero). */
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeWorkload(member: TeamMember, jobs: JobCard[]): WorkloadEntry {
  const owned = jobs.filter((j) => j.owner === member.csId);
  const counts: Record<WorkloadKey, number> = {
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
  const segments: WorkloadSegment[] = [
    { key: "new", value: counts.new },
    { key: "in_progress", value: counts.in_progress },
    { key: "done", value: counts.done },
    { key: "overdue", value: counts.overdue },
  ];
  const active = counts.new + counts.in_progress + counts.overdue;
  return { member, segments, total: owned.length, active };
}

// --- Local distribution bar component ---

interface DistBarProps {
  label: string;
  count: number;
  max: number;
  color: string;
}

function DistBar({ label, count, max, color }: DistBarProps): React.ReactElement {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div
        className="h-[22px] min-w-[60px] flex-1 overflow-hidden rounded-[6px]"
        style={{ backgroundColor: "#f1f0f5" }}
        role="img"
        aria-label={`${label}: ${count}`}
      >
        <div
          className="h-full rounded-[6px]"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-bold text-foreground">
        {count}
      </span>
    </div>
  );
}

// --- Page ---

export default async function ReportsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const days = parseDays(single(params.days));
  const currentUser = await getCurrentUser();

  if (!canViewAdmin(currentUser)) {
    return (
      <>
        <PageHeader
          title="รายงาน SLA & คอขวด"
          subtitle="วิเคราะห์ประสิทธิภาพและงานค้างของทีม CS"
        />
        <div className="px-6 pt-4 pb-8">
          <Panel>
            <p className="py-10 text-center text-sm text-muted-foreground">
              ไม่มีสิทธิ์เข้าถึงหน้านี้ — สำหรับ Lead และ Admin เท่านั้น
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const repo = getRepository();
  const [allJobs, team] = await Promise.all([
    repo.listJobs(),
    repo.listTeam(),
  ]);

  const cutoff = rangeCutoff(days);
  const inRangeJobs = allJobs.filter(
    (j) => new Date(j.createdAt).getTime() >= cutoff,
  );

  // Fetch activity logs in parallel for all in-range jobs.
  const activityEntries = await Promise.all(
    inRangeJobs.map(
      async (j) => [j.jobId, await repo.listActivity(j.jobId)] as const,
    ),
  );
  const activityByJob = new Map<string, ActivityLog[]>(
    activityEntries.map(([id, logs]) => [id, logs]),
  );

  // --- 1. Throughput ---
  const completedInRange = inRangeJobs.filter((j) => j.status === "Completed");

  // Time-to-accept: job_created -> first status_changed to "In Progress".
  const acceptDurations: number[] = [];
  for (const job of inRangeJobs) {
    const logs = activityByJob.get(job.jobId) ?? [];
    const firstInProgress = logs
      .filter(
        (l) => l.event === "status_changed" && l.newValue === "In Progress",
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
    if (firstInProgress) {
      const created = new Date(job.createdAt).getTime();
      const accepted = new Date(firstInProgress.timestamp).getTime();
      if (accepted >= created) acceptDurations.push(accepted - created);
    }
  }

  // Time-to-close: job_created -> job_closed event.
  const closeDurations: number[] = [];
  for (const job of completedInRange) {
    const logs = activityByJob.get(job.jobId) ?? [];
    const closed = logs.find((l) => l.event === "job_closed");
    if (closed) {
      const created = new Date(job.createdAt).getTime();
      const closedMs = new Date(closed.timestamp).getTime();
      if (closedMs >= created) closeDurations.push(closedMs - created);
    }
  }

  const avgAccept = average(acceptDurations);
  const avgClose = average(closeDurations);

  // --- 2. Risk ---
  const activeInRange = inRangeJobs.filter((j) => j.status !== "Completed");
  const overdueCount = activeInRange.filter((j) => isOverdue(j)).length;
  const nearDeadlineCount = activeInRange.filter(
    (j) => isNearDeadline(j),
  ).length;
  const overdueRate =
    activeInRange.length > 0
      ? Math.round((overdueCount / activeInRange.length) * 100)
      : 0;

  // --- 3. Bottleneck: distribution of active by status ---
  const statusBuckets: StatusBucket[] = ACTIVE_JOB_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: activeInRange.filter((j) => j.status === status).length,
    tone: STATUS_TONES[status],
  }));
  const statusMax = Math.max(1, ...statusBuckets.map((b) => b.count));

  // By service type
  const serviceBuckets: TypeBucket[] = SERVICE_TYPES.map((label) => ({
    label,
    count: activeInRange.filter((j) => j.serviceType === label).length,
  }));
  const serviceMax = Math.max(1, ...serviceBuckets.map((b) => b.count));

  // By shipment type
  const shipmentBuckets: TypeBucket[] = SHIPMENT_TYPES.map((label) => ({
    label,
    count: activeInRange.filter((j) => j.shipmentType === label).length,
  }));
  const shipmentMax = Math.max(1, ...shipmentBuckets.map((b) => b.count));

  // --- 4. Workload distribution per CS ---
  const activeMembers = team.filter((m) => m.active);
  const workloads = activeMembers
    .map((m) => computeWorkload(m, inRangeJobs))
    .sort((a, b) => b.active - a.active);

  return (
    <>
      <PageHeader
        title="รายงาน SLA & คอขวด"
        subtitle={`ช่วงเวลา ${days} วันที่ผ่านมา · ${inRangeJobs.length} งานในช่วง (${activeInRange.length} active)`}
        actions={
          <div className="flex items-center gap-1.5">
            {DAY_OPTIONS.map((d) => (
              <Link
                key={d}
                href={`?days=${d}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  days === d
                    ? "text-white"
                    : "text-[#657085] hover:bg-[#f5f3fb] hover:text-foreground",
                )}
                style={
                  days === d
                    ? { backgroundColor: "#4f46a5" }
                    : { border: "1px solid var(--border)" }
                }
              >
                {d} วัน
              </Link>
            ))}
          </div>
        }
      />

      {/* Throughput + Risk KPIs */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            label="งานเสร็จในช่วง"
            value={completedInRange.length}
            tone="ok"
          />
          <KpiCard
            label="เวลารับงานเฉลี่ย"
            value={avgAccept !== null ? formatDuration(avgAccept) : "—"}
          />
          <KpiCard
            label="เวลาปิดงานเฉลี่ย"
            value={avgClose !== null ? formatDuration(avgClose) : "—"}
          />
          <KpiCard label="Overdue" value={overdueCount} tone="danger" />
          <KpiCard
            label="อัตรา Overdue"
            value={`${overdueRate}%`}
            tone={overdueRate > 0 ? "danger" : "ok"}
          />
          <KpiCard label="ใกล้ Deadline" value={nearDeadlineCount} tone="warn" />
        </div>
      </div>

      {/* Bottleneck + Workload */}
      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel title="การกระจายงาน Active ตามสถานะ">
            <div className="flex flex-col gap-2.5">
              {statusBuckets.map((b) => (
                <DistBar
                  key={b.status}
                  label={b.label}
                  count={b.count}
                  max={statusMax}
                  color={b.tone}
                />
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Panel title="ตามประเภทบริการ">
              <div className="flex flex-col gap-2.5">
                {serviceBuckets.map((b) => (
                  <DistBar
                    key={b.label}
                    label={b.label}
                    count={b.count}
                    max={serviceMax}
                    color="#4f46a5"
                  />
                ))}
              </div>
            </Panel>

            <Panel title="ตามการขนส่ง">
              <div className="flex flex-col gap-2.5">
                {shipmentBuckets.map((b) => (
                  <DistBar
                    key={b.label}
                    label={b.label}
                    count={b.count}
                    max={shipmentMax}
                    color="#7050d6"
                  />
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Workload ตาม CS" actions={<WorkloadLegend />}>
          <div className="flex flex-col gap-4">
            {workloads.map(({ member, segments, total, active }) => (
              <div key={member.csId} className="flex items-center gap-3">
                <PersonaAvatar name={member.displayName} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="truncate text-sm font-bold text-foreground">
                      {member.displayName}
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {active} active · {total} ทั้งหมด
                    </span>
                  </div>
                  <WorkloadBar segments={segments} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
