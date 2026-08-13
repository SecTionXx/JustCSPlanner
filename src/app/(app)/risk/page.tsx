import { Button } from "@/components/ui/button";
import { StripeRow } from "@/components/shell";
import { getRepository } from "@/lib/repository";
import { formatDateTime, isNearDeadline, isOverdue } from "@/lib/utils";

import { PageHeader, Panel } from "../_components/field";

export const dynamic = "force-dynamic";

export default async function RiskPage(): Promise<React.ReactElement> {
  const repo = getRepository();
  const allJobs = await repo.listJobs();

  const overdue = allJobs.filter((j) => isOverdue(j));
  const nearDeadline = allJobs.filter((j) => isNearDeadline(j));
  const waitingLong = allJobs.filter(
    (j) => j.status === "Waiting Customer" || j.status === "Waiting Docs",
  );

  const subtitle = (job: { customer: string; bookingNumber?: string; route?: string }) =>
    `${job.route ? `${job.route} · ` : ""}${job.bookingNumber ?? ""}`;

  return (
    <>
      <PageHeader
        title="งานเสี่ยง"
        subtitle="ติดตามงานเกินกำหนด ใกล้ Cut-off และรอลูกค้านาน"
        actions={
          <Button variant="outline" className="h-9 rounded-[9px] text-sm font-bold">
            ส่งสรุปให้ทีม
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-3">
        <Panel title={<span className="text-[#c43850]">🔴 เกินกำหนด</span>}>
          <RiskList jobs={overdue} tone="red" subtitle={subtitle} empty="ไม่มีงานเกินกำหนด" />
        </Panel>

        <Panel title={<span className="text-[#d27b1c]">🟠 ใกล้ Cut-off</span>}>
          <RiskList
            jobs={nearDeadline}
            tone="orange"
            subtitle={subtitle}
            empty="ไม่มีงานใกล้ Cut-off"
          />
        </Panel>

        <Panel title={<span className="text-[#7c3aed]">🟣 รอลูกค้านาน</span>}>
          <RiskList
            jobs={waitingLong}
            tone="purple"
            subtitle={subtitle}
            empty="ไม่มีงานรอลูกค้า"
          />
        </Panel>
      </div>
    </>
  );
}

function RiskList({
  jobs,
  tone,
  subtitle,
  empty,
}: {
  jobs: { jobId: string; customer: string; bookingNumber?: string; route?: string; deadline: string }[];
  tone: "red" | "orange" | "purple";
  subtitle: (j: { customer: string; bookingNumber?: string; route?: string }) => string;
  empty: string;
}): React.ReactElement {
  if (jobs.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>;
  }
  return (
    <div>
      {jobs.map((job) => (
        <StripeRow
          key={job.jobId}
          tone={tone}
          title={job.customer}
          subtitle={subtitle(job)}
          meta={
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(job.deadline)}
            </span>
          }
          href={`/jobs/${job.jobId}`}
        />
      ))}
    </div>
  );
}
