import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canChangeDeadline, canEditJob, canReassign } from "@/lib/auth/permissions";
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

  const [job, team, currentUser] = await Promise.all([
    repo.getJob(id),
    repo.listTeam(),
    getCurrentUser(),
  ]);
  if (!job) notFound();

  // Base edit access. Owner/deadline changes are further gated on the form
  // (and enforced server-side in editJob).
  if (!canEditJob(currentUser, job)) {
    redirect(`/jobs/${id}`);
  }

  const activeTeam = team.filter((m) => m.active);
  const userCanReassign = canReassign(currentUser);
  const userCanChangeDeadline = canChangeDeadline(currentUser);

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
      <div className="pt-4 pb-8">
        <Panel>
          <EditJobForm
            job={job}
            team={activeTeam}
            canReassign={userCanReassign}
            canChangeDeadline={userCanChangeDeadline}
          />
        </Panel>
      </div>
    </>
  );
}
