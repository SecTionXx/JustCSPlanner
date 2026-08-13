import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ConfirmCard,
  KpiCard,
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
  const user = getCurrentUser();
  const repo = getRepository();

  const [allJobs] = await Promise.all([repo.listJobs()]);

  const inProgress = allJobs.filter((j) => j.status === "In Progress");
  const nearDeadline = allJobs.filter((j) => isNearDeadline(j));
  const overdue = allJobs.filter((j) => isOverdue(j));

  // "งานที่ต้องดูแลวันนี้": overdue first, then near-deadline.
  const today = [...overdue, ...nearDeadline].slice(0, 8);

  return (
    <>
      <PageHeader
        title={
          <span>
            สวัสดี {user.displayName} <span aria-hidden>👋</span>
          </span>
        }
        subtitle="ภาพรวม Freight Operations วันนี้"
        actions={
          <Button render={<Link href="/jobs/new" />} className="h-9 rounded-[9px] px-3 text-sm font-bold">
            ＋ สร้าง Job ใหม่
          </Button>
        }
      />

      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="งานทั้งหมด" value={allJobs.length} />
          <KpiCard label="กำลังดำเนินการ" value={inProgress.length} tone="ok" />
          <KpiCard label="ใกล้ Deadline" value={nearDeadline.length} tone="warn" />
          <KpiCard label="งานค้าง" value={overdue.length} tone="danger" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="งานที่ต้องดูแลวันนี้">
          {today.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ไม่มีงานเร่งด่วน 🎉
            </p>
          ) : (
            <div>
              {today.map((job) => (
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
            </div>
          )}
        </Panel>

        <ConfirmCard
          title="🤖 AI Operations Bot"
          confirmLabel="ยืนยัน Booking"
          editLabel="แก้ไข"
          cancelLabel="เก็บไว้ทีหลัง"
        >
          <p className="mb-2">
            <strong>JOB-2026-0001 · LCH Logistics</strong> — สรุปการจองครบถ้วน
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Routing: Bangkok → Singapore (FCL, ONE)</li>
            <li>• Cut-off ในอีก 60h — ยืนยัน SI และ Shipping Instruction</li>
            <li>• เอกสาร: ขอ SI จากลูกค้าก่อน cut-off</li>
          </ul>
        </ConfirmCard>
      </div>
    </>
  );
}
