import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/repository";
import { JOB_STATUSES, type JobStatus } from "@/lib/enums";
import type { JobFilter } from "@/lib/types";

import { PageHeader, Panel } from "../_components/field";
import { JobCardItem } from "../_components/job-card-item";
import { JobsFilter } from "./_components/jobs-filter";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function JobsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const statusRaw = single(params.status);
  const q = single(params.q);

  const filter: JobFilter = {};
  if (statusRaw && JOB_STATUSES.includes(statusRaw as JobStatus)) {
    filter.status = statusRaw as JobStatus;
  }
  if (q) filter.search = q;

  const repo = getRepository();
  const jobs = await repo.listJobs(filter);

  return (
    <>
      <PageHeader
        title="งานของฉัน"
        subtitle={`${jobs.length} งาน${filter.status ? ` · ${filter.status}` : ""}`}
        actions={
          <Button render={<Link href="/jobs/new" />} className="h-9 rounded-[9px] px-3 text-sm font-bold">
            ＋ สร้างงานใหม่
          </Button>
        }
      />

      <div className="px-6 pt-4 pb-8">
        <div className="mb-4">
          <Suspense fallback={<div className="h-16" />}>
            <JobsFilter />
          </Suspense>
        </div>

        {jobs.length === 0 ? (
          <Panel>
            <p className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบงานที่ตรงเงื่อนไข
            </p>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCardItem key={job.jobId} job={job} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
