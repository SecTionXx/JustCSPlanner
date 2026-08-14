import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  KpiCard,
  PriorityBadge,
  StatusBadge,
  StripeRow,
} from "@/components/shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";
import {
  formatDateTime,
  isNearDeadline,
  isOverdue,
} from "@/lib/utils";
import type { JobCard } from "@/lib/types";

import { PageHeader, Panel } from "./_components/field";

export const dynamic = "force-dynamic";

function jobStripeTone(job: JobCard): "red" | "orange" {
  return isOverdue(job) ? "red" : "orange";
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const repo = getRepository();

  const [allJobs] = await Promise.all([repo.listJobs()]);

  const inProgress = allJobs.filter((j) => j.status === "In Progress");
  const nearDeadline = allJobs.filter((j) => isNearDeadline(j));
  const overdue = allJobs.filter((j) => isOverdue(j));

  // "งานที่ต้องดูแลวันนี้": overdue first, then near-deadline.
  const overdueJobs = overdue.slice(0, 8);
  const nearJobs = nearDeadline
    .filter((j) => !isOverdue(j))
    .slice(0, 8);

  // Jobs awaiting first action (New) — surfaced instead of fake AI demo data.
  const awaiting = allJobs
    .filter((j) => j.status === "New")
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title={`สวัสดี ${user.displayName}`}
        subtitle="ภาพรวม Freight Operations วันนี้"
        actions={
          <Button render={<Link href="/jobs/new" />} className="h-9 rounded-[9px] px-3 text-sm font-bold">
            <Plus aria-hidden className="size-4" />
            สร้าง Job ใหม่
          </Button>
        }
      />

      <div className="pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="งานทั้งหมด" value={allJobs.length} href="/jobs" />
          <KpiCard
            label="กำลังดำเนินการ"
            value={inProgress.length}
            tone="ok"
            href="/jobs?status=In+Progress"
          />
          <KpiCard label="ใกล้ Deadline" value={nearDeadline.length} tone="warn" href="/risk" />
          <KpiCard label="งานค้าง" value={overdue.length} tone="danger" href="/risk" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4 pb-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {overdueJobs.length > 0 ? (
            <Panel title={`เกินกำหนด · ${overdueJobs.length}`}>
              {overdueJobs.map((job) => (
                <StripeRow
                  key={job.jobId}
                  tone={jobStripeTone(job)}
                  title={job.customer}
                  subtitle={
                    <>
                      {job.route ? `${job.route} · ` : ""}
                      {job.bookingNumber ?? job.jobId}
                    </>
                  }
                  meta={
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(job.deadline)}
                    </span>
                  }
                  href={`/jobs/${job.jobId}`}
                />
              ))}
            </Panel>
          ) : null}

          {nearJobs.length > 0 ? (
            <Panel title={`ใกล้ Deadline · ${nearJobs.length}`}>
              {nearJobs.map((job) => (
                <StripeRow
                  key={job.jobId}
                  tone="orange"
                  title={job.customer}
                  subtitle={
                    <>
                      {job.route ? `${job.route} · ` : ""}
                      {job.bookingNumber ?? job.jobId}
                    </>
                  }
                  meta={
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(job.deadline)}
                    </span>
                  }
                  href={`/jobs/${job.jobId}`}
                />
              ))}
            </Panel>
          ) : null}

          {overdueJobs.length === 0 && nearJobs.length === 0 ? (
            <Panel title="งานที่ต้องดูแลวันนี้">
              <p className="py-6 text-center text-sm text-muted-foreground">
                ไม่มีงานเร่งด่วน — ทุกงานอยู่ในกำหนดเวลา
              </p>
            </Panel>
          ) : null}
        </div>

        <Panel title="รอเริ่มดำเนินการ">
          {awaiting.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ไม่มีงานใหม่รอดำเนินการ
            </p>
          ) : (
            <div className="space-y-2">
              {awaiting.map((job) => (
                <Link
                  key={job.jobId}
                  href={`/jobs/${job.jobId}`}
                  className="block rounded-[10px] border border-border bg-background p-2.5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-[13px] font-semibold text-foreground">
                      {job.customer}
                    </strong>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <PriorityBadge priority={job.priority} />
                    <span className="text-[11px] text-muted-foreground">
                      {job.bookingNumber ?? job.jobId}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
