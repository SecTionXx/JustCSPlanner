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

        {totalPages > 1 ? <Pagination current={currentPage} total={totalPages} /> : null}
      </div>
    </>
  );
}

function Pagination({
  current,
  total,
}: {
  current: number;
  total: number;
}): React.ReactElement {
  return (
    <nav aria-label="แบ่งหน้า" className="mt-6 flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const page = i + 1;
        const sp = new URLSearchParams(globalThis.location?.search ?? "");
        sp.set("page", String(page));
        const qs = sp.toString();
        return (
          <Link
            key={page}
            href={qs ? `/jobs?${qs}` : "/jobs"}
            aria-current={page === current ? "page" : undefined}
            className={
              page === current
                ? "flex size-8 items-center justify-center rounded-[8px] bg-primary text-xs font-bold text-primary-foreground"
                : "flex size-8 items-center justify-center rounded-[8px] bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
            }
          >
            {page}
          </Link>
        );
      })}
    </nav>
  );
}
