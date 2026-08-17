import { Clock, MailWarning, OctagonAlert } from "lucide-react";

import { StripeRow } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canViewAdmin } from "@/lib/auth/permissions";
import { getRepository } from "@/lib/repository";
import {
  daysUntil,
  formatDateTime,
  isNearDeadline,
  isOverdue,
} from "@/lib/utils";

import { PageHeader, Panel } from "../_components/field";
import { SendSummaryButton } from "./_components/send-summary-button";

export const dynamic = "force-dynamic";

export default async function RiskPage(): Promise<React.ReactElement> {
  const repo = getRepository();
  const [allJobs, currentUser] = await Promise.all([
    repo.listJobs(),
    getCurrentUser(),
  ]);

  const overdue = allJobs.filter((j) => isOverdue(j));
  const nearDeadline = allJobs.filter((j) => isNearDeadline(j) && !isOverdue(j));
  const waitingLong = allJobs.filter(
    (j) => j.status === "Waiting Customer" || j.status === "Waiting Docs",
  );

  return (
    <>
      <PageHeader
        title="งานเสี่ยง"
        subtitle="ติดตามงานเกินกำหนด ใกล้ Cut-off และรอลูกค้านาน"
        actions={
          canViewAdmin(currentUser) ? <SendSummaryButton /> : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 pt-4 pb-8 lg:grid-cols-3">
        <Panel
          title={
            <span className="flex items-center gap-1.5 text-status-blocked">
              <OctagonAlert className="size-4" />
              เกินกำหนด · {overdue.length}
            </span>
          }
        >
          <RiskList
            jobs={overdue}
            tone="red"
            empty="ไม่มีงานเกินกำหนด"
            chip={(job) => `เกิน ${Math.abs(daysUntil(job.deadline))} วัน`}
          />
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-1.5 text-status-needs-help">
              <Clock className="size-4" />
              ใกล้ Cut-off · {nearDeadline.length}
            </span>
          }
        >
          <RiskList
            jobs={nearDeadline}
            tone="orange"
            empty="ไม่มีงานใกล้ Cut-off"
            chip={(job) => {
              const hours = Math.max(
                0,
                Math.round(
                  (new Date(job.deadline).getTime() - Date.now()) / 3_600_000,
                ),
              );
              return `อีก ${hours} ชม.`;
            }}
          />
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-1.5 text-status-new">
              <MailWarning className="size-4" />
              รอลูกค้า/เอกสาร · {waitingLong.length}
            </span>
          }
        >
          <RiskList
            jobs={waitingLong}
            tone="purple"
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
  empty,
  chip,
}: {
  jobs: { jobId: string; customer: string; bookingNumber?: string; route?: string; deadline: string }[];
  tone: "red" | "orange" | "purple";
  empty: string;
  chip?: (job: { deadline: string }) => string;
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
          subtitle={`${job.route ? `${job.route} · ` : ""}${job.bookingNumber ?? job.jobId}`}
          meta={
            <span className="text-right text-[11px] text-muted-foreground">
              {chip ? (
                <span className="mb-0.5 block font-semibold text-foreground">
                  {chip(job)}
                </span>
              ) : null}
              {formatDateTime(job.deadline)}
            </span>
          }
          href={`/jobs/${job.jobId}`}
        />
      ))}
    </div>
  );
}
