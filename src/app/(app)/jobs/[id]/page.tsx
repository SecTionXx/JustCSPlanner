import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACTIVITY_EVENT_TH,
  ACTIVITY_EVENT_TONE,
} from "@/lib/labels";
import {
  FileChips,
  PersonaAvatar,
  PriorityBadge,
  StatusBadge,
} from "@/components/shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditJob } from "@/lib/auth/permissions";
import { getRepository } from "@/lib/repository";
import {
  cn,
  daysUntil,
  formatDateTime,
  isNearDeadline,
  isOverdue,
} from "@/lib/utils";
import type { ActivityLog, JobCard } from "@/lib/types";

import { Field, PageHeader, Panel } from "../../_components/field";
import { JobCommentsClient } from "./_components/job-comments-client";
import { JobDetailClient } from "./_components/job-detail-client";
import { JOB_TAB_VALUES, JobTabs, type JobTabValue } from "./_components/job-tabs";
import { UploadFiles } from "./_components/upload-files";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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

function DeadlineChip({ job }: { job: JobCard }): React.ReactElement {
  const overdue = isOverdue(job);
  const near = isNearDeadline(job);
  const label = overdue
    ? `เกินกำหนด ${Math.abs(daysUntil(job.deadline))} วัน`
    : near
      ? `ใกล้กำหนด · ${formatDateTime(job.deadline)}`
      : formatDateTime(job.deadline);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        overdue
          ? "bg-tone-danger-soft text-tone-danger"
          : near
            ? "bg-tone-warning-soft text-tone-warning"
            : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const repo = getRepository();

  const [job, todos, activity, team, currentUser] = await Promise.all([
    repo.getJob(id),
    repo.listTodos(id),
    repo.listActivity(id),
    repo.listTeam(),
    getCurrentUser(),
  ]);

  if (!job) notFound();

  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: JobTabValue = JOB_TAB_VALUES.includes(tabParam as JobTabValue)
    ? (tabParam as JobTabValue)
    : "overview";

  const userCanEditJob = canEditJob(currentUser, job);

  const owner = team.find((m) => m.csId === job.owner);
  const ownerName = owner?.displayName ?? job.owner;
  const backup = team.find((m) => m.csId === job.backup);
  const backupName = backup?.displayName ?? job.backup;
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

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base text-muted-foreground">
              {job.jobId}
            </span>
            {job.bookingNumber ? (
              <span className="font-mono text-sm text-muted-foreground">
                · {job.bookingNumber}
              </span>
            ) : null}
          </span>
        }
        subtitle={`${job.customer}${job.route ? ` · ${job.route}` : ""}`}
        actions={
          <>
            <Button
              render={<Link href="/jobs" />}
              variant="ghost"
              className="h-9 rounded-[9px] text-sm font-semibold"
            >
              <ArrowLeft aria-hidden className="size-4" />
              กลับ
            </Button>
            {userCanEditJob ? (
              <Button
                render={<Link href={`/jobs/${id}/edit`} />}
                variant="outline"
                className="h-9 rounded-[9px] text-sm font-bold"
              >
                <Pencil aria-hidden className="size-4" />
                แก้ไขงาน
              </Button>
            ) : null}
          </>
        }
      />

      {/* Hero summary */}
      <div className="pt-4">
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border bg-card p-4">
          <StatusBadge status={job.status} />
          <PriorityBadge priority={job.priority} />
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            {job.shipmentType} · {job.serviceType}
          </span>
          <DeadlineChip job={job} />
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <PersonaAvatar name={ownerName} size="sm" />
              <span className="text-xs text-muted-foreground">
                Owner: <strong className="text-foreground">{ownerName}</strong>
              </span>
            </span>
            {job.backup ? (
              <span className="hidden items-center gap-1.5 sm:flex">
                <PersonaAvatar name={backupName ?? job.backup} size="sm" />
                <span className="text-xs text-muted-foreground">
                  ผู้ช่วย: <strong className="text-foreground">{backupName}</strong>
                </span>
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="pt-4 pb-8">
        <JobTabs tab={tab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="todos">To-do & ความคิดเห็น</TabsTrigger>
            <TabsTrigger value="docs">เอกสาร</TabsTrigger>
            <TabsTrigger value="activity">ประวัติกิจกรรม</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Panel title="ข้อมูลหลัก">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="Job ID" value={<span className="font-mono">{job.jobId}</span>} />
                <Field label="ลูกค้า" value={job.customer} />
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
                <Field label="Deadline" value={formatDateTime(job.deadline)} />
                <Field label="ความสำคัญ" value={<PriorityBadge priority={job.priority} />} />
                {job.carrier ? <Field label="Carrier" value={job.carrier} /> : null}
                {job.etd ? <Field label="ETD" value={formatDateTime(job.etd)} /> : null}
                {job.eta ? <Field label="ETA" value={formatDateTime(job.eta)} /> : null}
                {job.route ? <Field label="เส้นทาง" value={job.route} /> : null}
              </div>
              {job.latestSummary ? (
                <div className="mt-4 border-t border-border pt-3">
                  <Field label="Note / สรุปล่าสุด" value={job.latestSummary} />
                </div>
              ) : null}
            </Panel>
          </TabsContent>

          <TabsContent value="todos">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
              <Panel title="การดำเนินการ & To-do">
                <JobDetailClient
                  jobId={job.jobId}
                  status={job.status}
                  todos={todos}
                  ownerName={ownerName}
                  team={team}
                  canManage={userCanEditJob}
                />
              </Panel>
              <Panel title="ความคิดเห็น / Note">
                <JobCommentsClient jobId={job.jobId} comments={notes} />
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="docs">
            <Panel title="เอกสารแนบ">
              <div className="flex flex-wrap items-center gap-2">
                {docs.length > 0 ? (
                  <FileChips files={docs} showUploadPill={false} />
                ) : (
                  <p className="text-sm text-muted-foreground">ยังไม่มีเอกสารแนบ</p>
                )}
                {/* Real upload → Drive; manual paste-links stay in the edit form. */}
                {userCanEditJob ? <UploadFiles jobId={job.jobId} /> : null}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="activity">
            <Panel title="ประวัติกิจกรรม">
              {recentActivity.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  ยังไม่มีกิจกรรม
                </p>
              ) : (
                <ol className="relative space-y-4 before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px before:bg-border">
                  {recentActivity.map((log) => {
                    const actorName = teamById.get(log.actor) ?? log.actor;
                    return (
                      <li key={log.logId} className="relative pl-6">
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-1 left-0 size-[11px] rounded-full border-2 border-card",
                            ACTIVITY_EVENT_TONE[log.event]
                          )}
                        />
                        <div className="text-xs leading-relaxed">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <strong className="text-[13px] text-foreground">
                              {ACTIVITY_EVENT_TH[log.event]}
                            </strong>
                            <span className="text-[11px] text-muted-foreground">
                              {actorName} · {formatDateTime(log.timestamp)}
                            </span>
                          </div>
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
                      </li>
                    );
                  })}
                </ol>
              )}
            </Panel>
          </TabsContent>
        </JobTabs>
      </div>
    </>
  );
}
