import { Suspense } from "react";
import Link from "next/link";

import {
  PersonaAvatar,
  StatusBadge,
  StripeRow,
  WorkloadBar,
  WorkloadLegend,
  type WorkloadKey,
  type WorkloadSegment,
} from "@/components/shell";
import { canReassign, canViewAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";
import type { JobCard, TeamMember } from "@/lib/types";
import { formatDateTime, isNearDeadline, isOverdue } from "@/lib/utils";

import { PageHeader, Panel } from "../_components/field";
import { AssignFilters } from "./_components/assign-filters";
import { ReassignControl } from "./_components/reassign-control";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

interface WorkloadEntry {
  member: TeamMember;
  segments: WorkloadSegment[];
  activeTotal: number;
}

/**
 * Compute workload segments for a member from the active-only job list.
 * "Done" is always 0 here because Completed jobs are excluded upstream,
 * but the segment is kept for a consistent legend.
 */
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
    else counts.in_progress += 1;
  }
  const segments: WorkloadSegment[] = [
    { key: "new", value: counts.new },
    { key: "in_progress", value: counts.in_progress },
    { key: "done", value: counts.done },
    { key: "overdue", value: counts.overdue },
  ];
  return { member, segments, activeTotal: owned.length };
}

function jobStripeTone(job: JobCard): "red" | "orange" | "green" {
  if (isOverdue(job)) return "red";
  if (isNearDeadline(job)) return "orange";
  return "green";
}

export default async function AssignPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (!canViewAdmin(user)) {
    return (
      <div className="px-6 pt-10">
        <Panel>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl" aria-hidden>
              🔒
            </span>
            <p className="text-sm font-bold text-foreground">
              ไม่มีสิทธิ์เข้าถึงหน้านี้
            </p>
            <p className="text-xs text-muted-foreground">
              หน้าจัดสรรงานสงวนไว้สำหรับ Lead และ Admin เท่านั้น
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  const params = await searchParams;
  const ownerFilter = single(params.owner);
  const overdueOnly = single(params.overdue) === "1";
  const nearOnly = single(params.near) === "1";

  const repo = getRepository();
  const [allJobs, team] = await Promise.all([
    repo.listJobs(),
    repo.listTeam(),
  ]);

  // Active jobs only (exclude Completed).
  const activeJobs = allJobs.filter((j) => j.status !== "Completed");

  const activeMembers = team.filter((m) => m.active);
  const workloads = activeMembers.map((m) => computeWorkload(m, activeJobs));

  // Apply URL filters for the reassignable list.
  let filteredJobs = activeJobs;
  if (ownerFilter) {
    filteredJobs = filteredJobs.filter((j) => j.owner === ownerFilter);
  }
  if (overdueOnly) {
    filteredJobs = filteredJobs.filter((j) => isOverdue(j));
  }
  if (nearOnly) {
    filteredJobs = filteredJobs.filter((j) => isNearDeadline(j));
  }

  const canReassignJobs = canReassign(user);

  return (
    <>
      <PageHeader
        title="จัดสรรงาน / Workload"
        subtitle="แจกจ่ายและโอนงานให้สมาชิกในทีม CS"
      />

      {/* Workload summary */}
      <div className="pt-5">
        <Panel title="Workload ตาม CS" actions={<WorkloadLegend />}>
          {workloads.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              ไม่มีสมาชิกในทีม
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {workloads.map(({ member, segments, activeTotal }) => (
                <div key={member.csId} className="flex items-center gap-3">
                  <PersonaAvatar name={member.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <strong className="truncate text-sm font-bold text-foreground">
                        {member.displayName}
                      </strong>
                      <span className="text-[11px] text-muted-foreground">
                        {activeTotal} งาน active
                      </span>
                    </div>
                    <WorkloadBar segments={segments} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Filters + reassignable jobs */}
      <div className="pt-4 pb-8">
        <Panel
          title={`งานที่จัดสรรได้ (${filteredJobs.length})`}
          actions={
            <Suspense fallback={<div className="h-8" />}>
              <AssignFilters team={activeMembers} />
            </Suspense>
          }
        >
          {filteredJobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              ไม่มีงานที่ตรงเงื่อนไข
            </p>
          ) : (
            <div>
              {filteredJobs.map((job) => {
                const ownerName =
                  team.find((m) => m.csId === job.owner)?.displayName ??
                  job.owner;
                return (
                  <StripeRow
                    key={job.jobId}
                    tone={jobStripeTone(job)}
                    title={
                      <span className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/jobs/${job.jobId}`}
                          className="hover:underline"
                        >
                          {job.customer}
                        </Link>
                        <StatusBadge status={job.status} />
                      </span>
                    }
                    subtitle={
                      <span className="flex items-center gap-1.5">
                        <PersonaAvatar name={ownerName} size="sm" />
                        {ownerName}
                        <span aria-hidden>·</span>
                        {job.bookingNumber ?? job.jobId}
                      </span>
                    }
                    meta={
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(job.deadline)}
                        </span>
                        <ReassignControl
                          jobId={job.jobId}
                          currentOwnerCsId={job.owner}
                          currentOwnerName={ownerName}
                          team={activeMembers}
                          canReassign={canReassignJobs}
                        />
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
