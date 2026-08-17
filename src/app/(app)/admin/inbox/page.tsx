import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isAiEnabled } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canViewAdmin } from "@/lib/auth/permissions";
import { EMAIL_INBOX_STATUSES, type EmailInboxStatus } from "@/lib/enums";
import { EMAIL_STATUS_TH } from "@/lib/labels";
import { getRepository } from "@/lib/repository";
import type { EmailInbox, JobCard } from "@/lib/types";
import { Inbox } from "lucide-react";

import { cn, formatDateTime } from "@/lib/utils";

import { PageHeader, Panel } from "../../_components/field";
import { AddEmailForm } from "./_components/add-email-form";
import { EmailRowActions, type JobOption } from "./_components/email-row-actions";
import { suggestJobId } from "./suggest-job";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const STATUS_CLASSES: Record<EmailInboxStatus, string> = {
  new: "bg-status-needs-help-soft text-status-needs-help",
  linked: "bg-status-completed-soft text-status-completed",
  converted: "bg-status-waiting-docs-soft text-status-waiting-docs",
  ignored: "bg-muted text-muted-foreground",
};

const SOURCE_LABEL: Record<EmailInbox["source"], string> = {
  paste: "วางเอง",
  webhook: "webhook",
};

export default async function InboxPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (!canViewAdmin(user)) {
    return (
      <>
        <PageHeader title="กล่องรับอีเมลเข้า" subtitle="Email inbox staging" />
        <div className="pt-4 pb-8">
          <Panel title="ไม่มีสิทธิ์เข้าถึง">
            <p className="py-4 text-center text-sm text-muted-foreground">
              หน้านี้สำหรับ Lead และ Admin เท่านั้น
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const params = await searchParams;
  const statusRaw = single(params.status);
  const status =
    statusRaw && EMAIL_INBOX_STATUSES.includes(statusRaw as EmailInboxStatus)
      ? (statusRaw as EmailInboxStatus)
      : undefined;

  const repo = getRepository();
  const [allEmails, jobs] = await Promise.all([repo.listEmails(status), repo.listJobs()]);

  // Newest first; jobs too (so the match select surfaces recent work).
  const emails = [...allEmails].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const jobOptions: JobOption[] = sortedJobs.map((job) => ({
    jobId: job.jobId,
    customer: job.customer,
    bookingNumber: job.bookingNumber,
  }));
  const jobById = new Map(sortedJobs.map((job) => [job.jobId, job]));
  const aiEnabled = isAiEnabled();

  return (
    <>
      <PageHeader
        title="กล่องรับอีเมลเข้า"
        subtitle={`อีเมลรอดำเนินการ ${emails.length} รายการ${status ? ` · ${EMAIL_STATUS_TH[status]}` : ""}`}
      />

      <div className="pt-4 pb-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel
            title="เพิ่มอีเมล (วางข้อความ)"
            className="xl:col-span-2"
          >
            <AddEmailForm />
          </Panel>

          <Panel title="รับอีเมลอัตโนมัติ (Webhook)">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                ส่งอีเมลเข้าระบบจากภายนอกด้วย{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">
                  POST /api/email-inbound
                </code>{" "}
                พร้อม JSON{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {`{ from, subject, body }`}
                </code>
              </p>
              <p>
                ป้องกันด้วย{" "}
                <code className="rounded bg-muted px-1 py-0.5">INBOUND_SECRET</code>{" "}
                (Header{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  Authorization: Bearer ...
                </code>{" "}
                หรือ{" "}
                <code className="rounded bg-muted px-1 py-0.5">?secret=...</code>)
              </p>
              <p>
                การเชื่อมงานใช้การแนะนำจากเลข booking/ชื่อลูกค้าโดยไม่ต้องพึ่ง AI
                {aiEnabled
                  ? " — และเปิดปุ่ม “ร่างงานใหม่ (AI)” ให้ด้วย"
                  : " (ปุ่มร่างงานใหม่ด้วย AI จะแสดงเมื่อตั้ง AI_API_KEY)"}
              </p>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <StatusChip active={status === undefined} href="/admin/inbox">
            ทั้งหมด
          </StatusChip>
          {EMAIL_INBOX_STATUSES.map((value) => (
            <StatusChip
              key={value}
              active={status === value}
              href={value === "new" ? "/admin/inbox" : `/admin/inbox?status=${value}`}
            >
              {EMAIL_STATUS_TH[value]}
            </StatusChip>
          ))}
        </div>

        <div className="mt-3">
          <Panel>
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <span
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Inbox className="size-6" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  ยังไม่มีอีเมลในกล่องรับ
                </p>
                <p className="text-xs text-muted-foreground">
                  วางข้อความอีเมลด้านบน หรือส่งเข้าผ่าน webhook เพื่อเริ่มใช้งาน
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {emails.map((email) => (
                  <EmailRow
                    key={email.emailId}
                    email={email}
                    jobs={jobOptions}
                    matchedJob={email.matchedJobId ? jobById.get(email.matchedJobId) : undefined}
                    aiHref={
                      aiEnabled
                        ? `/jobs/new?aiText=${encodeURIComponent(
                            `${email.subject}\n\n${email.body ?? ""}`,
                          )}`
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function StatusChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

function EmailRow({
  email,
  jobs,
  matchedJob,
  aiHref,
}: {
  email: EmailInbox;
  jobs: JobOption[];
  matchedJob?: JobCard;
  aiHref?: string;
}): React.ReactElement {
  const suggestion =
    email.status === "new" ? suggestJobId(email, jobs) : undefined;

  return (
    <li className="flex flex-col gap-2 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[email.status]}`}
        >
          {EMAIL_STATUS_TH[email.status]}
        </span>
        <span className="text-sm font-bold text-foreground">{email.subject}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {SOURCE_LABEL[email.source]}
        </span>
        {matchedJob ? (
          <Button
            render={<Link href={`/jobs/${matchedJob.jobId}`} />}
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
          >
            {matchedJob.jobId}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span>จาก: {email.fromAddress}</span>
        <span>{formatDateTime(email.receivedAt)}</span>
        {email.handledBy ? (
          <span>
            จัดการโดย {email.handledBy}
            {email.handledAt ? ` · ${formatDateTime(email.handledAt)}` : ""}
          </span>
        ) : null}
      </div>

      {email.body ? (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold text-primary hover:underline">
            ดูข้อความ
          </summary>
          <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2.5 text-xs text-foreground">
            {email.body}
          </pre>
        </details>
      ) : null}

      {email.status === "new" ? (
        <EmailRowActions
          emailId={email.emailId}
          jobs={jobs}
          suggestedJobId={suggestion}
          aiHref={aiHref}
        />
      ) : null}
    </li>
  );
}
