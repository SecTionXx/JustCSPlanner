import {
  KpiCard,
  PersonaAvatar,
  StripeRow,
  WorkloadBar,
  WorkloadLegend,
} from "@/components/shell";
import { canViewAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buildDailySummary } from "@/lib/notifications/summary";
import type { SummaryJobItem } from "@/lib/notifications/summary";

import { PageHeader, Panel } from "../../_components/field";
import { SendTestSummaryButton } from "./_components/send-test-summary-button";

export const dynamic = "force-dynamic";

/** Render a list of summary jobs as StripeRows inside a Panel. */
function JobListPanel({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: SummaryJobItem[];
  tone: "red" | "orange" | "purple" | "green";
  emptyText: string;
}): React.ReactElement {
  return (
    <Panel title={`${title} (${items.length})`}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div>
          {items.map((job) => (
            <StripeRow
              key={job.jobId}
              tone={tone}
              title={job.customer}
              subtitle={`${job.route ? `${job.route} · ` : ""}${job.bookingNumber ?? job.jobId}`}
              meta={<PersonaAvatar name={job.ownerName} size="sm" />}
              href={`/jobs/${job.jobId}`}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

export default async function SummaryPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (!canViewAdmin(user)) {
    return (
      <>
        <PageHeader title="สรุปประจำวัน" subtitle="Daily summary dashboard" />
        <div className="px-6 pt-4 pb-8">
          <Panel title="ไม่มีสิทธิ์เข้าถึง">
            <p className="py-4 text-center text-sm text-muted-foreground">
              หน้านี้สำหรับ Lead และ Admin เท่านั้น
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const summary = await buildDailySummary();

  return (
    <>
      <PageHeader
        title="สรุปประจำวัน"
        subtitle="ภาพรวมงานและภาระงานของทีม CS ประจำวันนี้"
        actions={<SendTestSummaryButton />}
      />

      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="งาน Active" value={summary.counts.totalActive} />
          <KpiCard
            label="เกินกำหนด"
            value={summary.counts.overdue}
            tone="danger"
          />
          <KpiCard
            label="Deadline วันนี้"
            value={summary.counts.dueToday}
            tone="warn"
          />
          <KpiCard
            label="ติดขัด/Needs Help"
            value={summary.counts.blocked}
            tone="new"
          />
          <KpiCard
            label="งานใหม่ (24 ชม.)"
            value={summary.counts.new24h}
            tone="ok"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 lg:grid-cols-2">
        <JobListPanel
          title="งานเกินกำหนด"
          items={summary.overdue}
          tone="red"
          emptyText="ไม่มีงานเกินกำหนด"
        />
        <JobListPanel
          title="Deadline วันนี้"
          items={summary.dueToday}
          tone="orange"
          emptyText="ไม่มีงานครบกำหนดวันนี้"
        />
        <JobListPanel
          title="ติดขัด / Needs Help"
          items={summary.blocked}
          tone="purple"
          emptyText="ไม่มีงานติดขัด"
        />
        <JobListPanel
          title="งานใหม่ (24 ชม.)"
          items={summary.newSinceYesterday}
          tone="green"
          emptyText="ไม่มีงานใหม่ใน 24 ชม. ที่ผ่านมา"
        />
      </div>

      <div className="px-6 pt-4 pb-8">
        <Panel title="ภาระงานตาม CS" actions={<WorkloadLegend />}>
          <div className="flex flex-col gap-4">
            {summary.workloads.map((w) => (
              <div key={w.csId} className="flex items-center gap-3">
                <PersonaAvatar name={w.displayName} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="truncate text-sm font-bold text-foreground">
                      {w.displayName}
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {w.active} active · {w.total} ทั้งหมด
                    </span>
                  </div>
                  <WorkloadBar segments={w.segments} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
