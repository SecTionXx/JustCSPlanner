import { notFound } from "next/navigation";

import { getRepository } from "@/lib/repository";

import { PageHeader, Panel } from "../../../_components/field";
import { EditJobForm } from "./_components/edit-job-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const repo = getRepository();

  const [job, team] = await Promise.all([repo.getJob(id), repo.listTeam()]);
  if (!job) notFound();

  const activeTeam = team.filter((m) => m.active);

  return (
    <>
      <PageHeader
        title={
          <span>
            แก้ไขงาน ·{" "}
            <span className="text-muted-foreground">
              {job.bookingNumber ?? job.jobId}
            </span>
          </span>
        }
        subtitle={`${job.customer}${job.route ? ` · ${job.route}` : ""}`}
      />
      <div className="px-6 pt-4 pb-8">
        <Panel>
          <EditJobForm job={job} team={activeTeam} />
        </Panel>
      </div>
    </>
  );
}
