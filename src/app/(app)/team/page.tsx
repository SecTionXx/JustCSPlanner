import { Button } from "@/components/ui/button";
import {
  KpiCard,
  PersonaAvatar,
  StripeRow,
  WorkloadBar,
  WorkloadLegend,
  type WorkloadKey,
  type WorkloadSegment,
} from "@/components/shell";
import { getRepository } from "@/lib/repository";
import { isNearDeadline, isOverdue } from "@/lib/utils";
import type { JobCard, TeamMember } from "@/lib/types";

import { PageHeader, Panel } from "../_components/field";

export const dynamic = "force-dynamic";

interface WorkloadEntry {
  member: TeamMember;
  segments: WorkloadSegment[];
  total: number;
  statusPill: { label: string; tone: string };
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
  const total = owned.length;
  const active = owned.filter((j) => j.status !== "Completed").length;
  const overdueCount = counts.overdue;

  let statusPill: { label: string; tone: string };
  if (overdueCount >= 2) {
    statusPill = { label: "งานล้น", tone: "#c43850" };
  } else if (active >= 4) {
    statusPill = { label: "ต้องติดตาม", tone: "#d27b1c" };
  } else {
    statusPill = { label: "รับเพิ่มได้", tone: "#177a55" };
  }

  return { member, segments, total, statusPill };
}

export default async function TeamPage(): Promise<React.ReactElement> {
  const repo = getRepository();
  const [allJobs, team] = await Promise.all([repo.listJobs(), repo.listTeam()]);

  const activeJobs = allJobs.filter((j) => j.status !== "Completed");
  const newCount = allJobs.filter((j) => j.status === "New").length;
  const nearDeadline = allJobs.filter((j) => isNearDeadline(j)).length;
  const overdue = allJobs.filter((j) => isOverdue(j)).length;

  const activeMembers = team.filter((m) => m.active);
  const workloads = activeMembers.map((m) => computeWorkload(m, allJobs));

  const riskJobs = allJobs
    .filter((j) => isOverdue(j) || isNearDeadline(j))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="CS Team Dashboard"
        subtitle="ภาพรวม workload และงานเสี่ยงของทีม CS"
        actions={
          <Button variant="outline" className="h-9 rounded-[9px] text-sm font-bold">
            จัดสรรงาน
          </Button>
        }
      />

      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="งาน Active" value={activeJobs.length} />
          <KpiCard label="New" value={newCount} tone="new" />
          <KpiCard label="ใกล้ Deadline" value={nearDeadline} tone="warn" />
          <KpiCard label="Overdue" value={overdue} tone="danger" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel
            title="Workload ตาม CS"
            actions={<WorkloadLegend />}
          >
            <div className="flex flex-col gap-4">
              {workloads.map(({ member, segments, total }) => (
                <div key={member.csId} className="flex items-center gap-3">
                  <PersonaAvatar name={member.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <strong className="truncate text-sm font-bold text-foreground">
                        {member.displayName}
                      </strong>
                      <span className="text-[11px] text-muted-foreground">
                        {total} งาน
                      </span>
                    </div>
                    <WorkloadBar segments={segments} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="งานเสี่ยงที่ต้องติดตาม">
            {riskJobs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                ไม่มีงานเสี่ยง
              </p>
            ) : (
              <div>
                {riskJobs.map((job) => (
                  <StripeRow
                    key={job.jobId}
                    tone={isOverdue(job) ? "red" : "orange"}
                    title={job.customer}
                    subtitle={`${job.route ? `${job.route} · ` : ""}${job.bookingNumber ?? job.jobId}`}
                    meta={
                      <PersonaAvatar
                        name={
                          team.find((m) => m.csId === job.owner)?.displayName ?? job.owner
                        }
                        size="sm"
                      />
                    }
                    href={`/jobs/${job.jobId}`}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="สรุปรายบุคคล">
          <div className="flex flex-col gap-3">
            {workloads.map(({ member, segments, total, statusPill }) => {
              const activeCount =
                segments[0].value + segments[1].value + segments[3].value;
              return (
                <div
                  key={member.csId}
                  className="flex items-center gap-3 rounded-[10px] border p-2.5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <PersonaAvatar name={member.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="truncate text-sm font-bold text-foreground">
                        {member.displayName}
                      </strong>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${statusPill.tone}1a`,
                          color: statusPill.tone,
                        }}
                      >
                        {statusPill.label}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {activeCount} งาน active · {total} ทั้งหมด
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}
