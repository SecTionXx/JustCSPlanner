import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  FileChips,
  PersonaAvatar,
  StatusBadge,
} from "@/components/shell";
import { getRepository } from "@/lib/repository";
import { formatDateTime, isNearDeadline, isOverdue } from "@/lib/utils";
import type { ActivityLog } from "@/lib/types";

import { Field, PageHeader, Panel } from "../../_components/field";
import { JobCommentsClient } from "./_components/job-comments-client";
import { JobDetailClient } from "./_components/job-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EVENT_LABELS: Record<ActivityLog["event"], string> = {
  job_created: "สร้างงาน",
  job_closed: "ปิดงาน",
  status_changed: "เปลี่ยนสถานะ",
  owner_changed: "เปลี่ยนเจ้าของงาน",
  deadline_changed: "เปลี่ยน Deadline",
  todo_added: "เพิ่ม To-do",
  todo_completed: "ทำ To-do เสร็จ",
  note_added: "เพิ่ม Note",
  doc_added: "แนบเอกสาร",
};

function activityBody(log: ActivityLog): string {
  switch (log.event) {
    case "status_changed":
    case "job_closed":
      return `${log.oldValue ?? "—"} → ${log.newValue ?? "—"}`;
    case "owner_changed":
      return `${log.oldValue ?? "—"} → ${log.newValue ?? "—"}`;
    case "deadline_changed":
      return `${formatDateTime(log.oldValue)} → ${formatDateTime(log.newValue)}`;
    case "todo_added":
    case "doc_added":
      return log.newValue ?? "";
    default:
      return log.newValue ?? log.field ?? "";
  }
}

export default async function JobDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const repo = getRepository();

  const [job, todos, activity, team] = await Promise.all([
    repo.getJob(id),
    repo.listTodos(id),
    repo.listActivity(id),
    repo.listTeam(),
  ]);

  if (!job) notFound();

  const owner = team.find((m) => m.csId === job.owner);
  const ownerName = owner?.displayName ?? job.owner;
  const teamById = new Map(team.map((m) => [m.csId, m.displayName]));

  const docs = (job.docLinks ?? []).map((url) => ({
    name: url.split("/").pop() ?? url,
    url,
  }));

  const recentActivity = activity
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  // Notes/comments are ActivityLog rows with event "note_added"; the body lives
  // in `newValue`. Newest first for the thread.
  const notes = activity
    .filter((a) => a.event === "note_added")
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .map((a) => ({
      id: a.logId,
      author: teamById.get(a.actor) ?? a.actor,
      time: formatDateTime(a.timestamp),
      body: a.newValue ?? "",
    }));

  const deadlineTone = isOverdue(job)
    ? "danger"
    : isNearDeadline(job)
      ? "warn"
      : undefined;

  return (
    <>
      <PageHeader
        title={
          <span>
            Job Card · <span className="text-muted-foreground">{job.bookingNumber ?? job.jobId}</span>
          </span>
        }
        subtitle={`${job.customer}${job.route ? ` · ${job.route}` : ""}`}
        actions={
          <Button
            render={<Link href={`/jobs/${id}/edit`} />}
            variant="outline"
            className="h-9 rounded-[9px] text-sm font-bold"
          >
            ✎ แก้ไขงาน
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-[1.5fr_0.75fr]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <Panel title="ข้อมูลหลัก">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Job ID" value={job.jobId} />
              <Field
                label="สถานะ"
                value={<StatusBadge status={job.status} />}
              />
              <Field label="ประเภท" value={`${job.shipmentType} · ${job.serviceType}`} />
              <Field
                label="Owner"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <PersonaAvatar name={ownerName} size="sm" />
                    {ownerName}
                  </span>
                }
              />
              <Field
                label="Deadline"
                value={
                  <span style={deadlineTone === "danger" ? { color: "#c43850" } : deadlineTone === "warn" ? { color: "#d27b1c" } : undefined}>
                    {formatDateTime(job.deadline)}
                  </span>
                }
              />
              <Field label="Priority" value={job.priority} />
              {job.carrier ? <Field label="Carrier" value={job.carrier} /> : null}
              {job.etd ? <Field label="ETD" value={formatDateTime(job.etd)} /> : null}
              {job.eta ? <Field label="ETA" value={formatDateTime(job.eta)} /> : null}
              {job.route ? <Field label="Route" value={job.route} /> : null}
            </div>
            {job.latestSummary ? (
              <div className="mt-4 border-t border-[#f0eef5] pt-3">
                <Field label="Note / สรุปล่าสุด" value={job.latestSummary} />
              </div>
            ) : null}
          </Panel>

          <Panel title="การดำเนินการ & To-do">
            <JobDetailClient
              jobId={job.jobId}
              status={job.status}
              todos={todos}
              ownerName={ownerName}
              team={team}
            />
          </Panel>

          <Panel title="ความคิดเห็น / Note">
            <JobCommentsClient jobId={job.jobId} comments={notes} />
          </Panel>

          {docs.length > 0 ? (
            <Panel title="เอกสารแนบ">
              <FileChips files={docs} />
            </Panel>
          ) : null}
        </div>

        {/* Right column — activity feed */}
        <Panel title="ประวัติกิจกรรม">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              ยังไม่มีกิจกรรม
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((log) => {
                const actorName = teamById.get(log.actor) ?? log.actor;
                return (
                  <div
                    key={log.logId}
                    className="rounded-[9px] bg-[#f8f7fc] px-2.5 py-2.5 text-xs leading-relaxed text-foreground"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[#6049af]">
                      <span className="inline-flex items-center gap-1.5">
                        <PersonaAvatar name={actorName} size="sm" />
                        {actorName}
                      </span>
                      <span className="font-normal text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div>
                      <strong>{EVENT_LABELS[log.event]}</strong>
                      {log.field && log.field !== "todoId" ? (
                        <span className="text-muted-foreground"> · {log.field}</span>
                      ) : null}
                      {activityBody(log) ? (
                        <div className="mt-0.5 text-muted-foreground">
                          {activityBody(log)}
                        </div>
                      ) : null}
                      {log.reason ? (
                        <div className="mt-0.5 italic text-muted-foreground">
                          “{log.reason}”
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            render={<Link href="/jobs" />}
            variant="outline"
            className="mt-3 h-9 w-full rounded-[9px] font-bold"
          >
            ← กลับไปรายการงาน
          </Button>
        </Panel>
      </div>
    </>
  );
}
