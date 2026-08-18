import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/repository";
import { JOB_STATUSES, type JobStatus, type Priority } from "@/lib/enums";
import { JOB_STATUS_TH } from "@/lib/labels";
import type { JobCard, JobFilter } from "@/lib/types";

import { PageHeader, Panel } from "../_components/field";
import { JobCardItem, JobListItem } from "../_components/job-card-item";
import { JobsFilter } from "./_components/jobs-filter";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const PRIORITY_ORDER: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Normal: 2,
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function sortJobs(jobs: JobCard[], sort: string): JobCard[] {
  const byDeadline = (a: JobCard, b: JobCard): number =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

  switch (sort) {
    case "priority":
      return [...jobs].sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          byDeadline(a, b),
      );
    case "created":
      return [...jobs].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "customer":
      return [...jobs].sort((a, b) =>
        a.customer.localeCompare(b.customer, "th"),
      );
    case "deadline":
    default:
      return [...jobs].sort(byDeadline);
  }
}

export default async function JobsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const statusRaw = single(params.status);
  const q = single(params.q);
  const sort = single(params.sort) ?? "deadline";
  const view = single(params.view) === "list" ? "list" : "grid";
  const page = Math.max(1, Number.parseInt(single(params.page) ?? "1", 10) || 1);

  const filter: JobFilter = {};
  if (statusRaw && JOB_STATUSES.includes(statusRaw as JobStatus)) {
    filter.status = statusRaw as JobStatus;
  }
  if (q) filter.search = q;

  const repo = getRepository();
  const allJobs = sortJobs(await repo.listJobs(filter), sort);

  const totalPages = Math.max(1, Math.ceil(allJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const jobs = allJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const subtitleParts = [`${allJobs.length} งาน`];
  if (filter.status) subtitleParts.push(JOB_STATUS_TH[filter.status]);
  if (allJobs.length > PAGE_SIZE)
    subtitleParts.push(`หน้า ${currentPage}/${totalPages}`);

  return (
    <>
      <PageHeader
        title="งานของฉัน"
        subtitle={subtitleParts.join(" · ")}
        actions={
          <Button render={<Link href="/jobs/new" />} className="h-9 rounded-[9px] px-3 text-sm font-bold">
            <Plus aria-hidden className="size-4" />
            สร้างงานใหม่
          </Button>
        }
      />

      <div className="pt-4 pb-8">
        <div className="mb-4">
          <Suspense fallback={<div className="h-24" />}>
            <JobsFilter />
          </Suspense>
        </div>

        {jobs.length === 0 ? (
          <Panel>
            <p className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบงานที่ตรงเงื่อนไข
            </p>
          </Panel>
        ) : view === "list" ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobListItem key={job.jobId} job={job} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCardItem key={job.jobId} job={job} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <Pagination current={currentPage} total={totalPages} params={params} />
        ) : null}
      </div>
    </>
  );
}

/**
 * Page numbers to render: always 1, total, and current±1, with "gap" markers
 * where a range was skipped. Keeps the nav at ≤7 slots regardless of total.
 */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  for (const page of sorted) {
    const prev = result[result.length - 1];
    if (typeof prev === "number" && page - prev > 1) result.push("gap");
    result.push(page);
  }
  return result;
}

const PAGE_LINK_CLASS =
  "flex size-8 items-center justify-center rounded-[8px] bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary";
const PAGE_LINK_ACTIVE_CLASS =
  "flex size-8 items-center justify-center rounded-[8px] bg-primary text-xs font-bold text-primary-foreground";

function Pagination({
  current,
  total,
  params,
}: {
  current: number;
  total: number;
  /** Raw searchParams — filters/sort/view are preserved across page links. */
  params: Record<string, string | string[] | undefined>;
}): React.ReactElement {
  const pageHref = (page: number): string => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const v = single(value);
      if (v !== undefined) sp.set(key, v);
    }
    sp.set("page", String(page));
    return `/jobs?${sp.toString()}`;
  };

  const step = (
    page: number,
    label: string,
    arrow: string,
    disabled: boolean,
    key: string,
  ): React.ReactElement =>
    disabled ? (
      <span
        key={key}
        aria-disabled="true"
        aria-label={label}
        className={`${PAGE_LINK_CLASS} pointer-events-none opacity-50`}
      >
        {arrow}
      </span>
    ) : (
      <Link key={key} href={pageHref(page)} aria-label={label} className={PAGE_LINK_CLASS}>
        {arrow}
      </Link>
    );

  return (
    <nav aria-label="แบ่งหน้า" className="mt-6 flex items-center justify-center gap-2">
      {step(current - 1, "หน้าก่อนหน้า", "‹", current <= 1, "prev")}
      {pageWindow(current, total).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-0.5 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(item)}
            aria-current={item === current ? "page" : undefined}
            className={item === current ? PAGE_LINK_ACTIVE_CLASS : PAGE_LINK_CLASS}
          >
            {item}
          </Link>
        ),
      )}
      {step(current + 1, "หน้าถัดไป", "›", current >= total, "next")}
    </nav>
  );
}
