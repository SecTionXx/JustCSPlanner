"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/shell";
import type { JobCard, JobPatch } from "@/lib/types";

import { editJob } from "../../../../actions";
import {
  JobFormFields,
  type JobFormValues,
} from "../../../_components/job-form-fields";

export interface EditJobFormProps {
  job: JobCard;
  team: Parameters<typeof JobFormFields>[0]["team"];
  /** Whether the user may change the job owner (lead/admin). */
  canReassign: boolean;
  /** Whether the user may change the deadline (lead/admin). */
  canChangeDeadline: boolean;
}

/** ISO "2026-08-14T15:00:00.000+07:00" → datetime-local "2026-08-14T15:00". */
function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** datetime-local "YYYY-MM-DDTHH:mm" → ISO with Bangkok offset. */
function toIso(local: string): string | undefined {
  if (!local.trim()) return undefined;
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(local)
    ? `${local}:00+07:00`
    : local;
}

function orUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function EditJobForm({
  job,
  team,
  canReassign,
  canChangeDeadline,
}: EditJobFormProps): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const originalDeadlineLocal = toDatetimeLocal(job.deadline);

  const [form, setForm] = React.useState<JobFormValues>({
    customer: job.customer,
    owner: job.owner,
    deadline: originalDeadlineLocal,
    status: job.status,
    shipmentType: job.shipmentType,
    serviceType: job.serviceType,
    priority: job.priority,
    bookingNumber: job.bookingNumber ?? "",
    route: job.route ?? "",
    carrier: job.carrier ?? "",
    etd: toDatetimeLocal(job.etd),
    eta: toDatetimeLocal(job.eta),
    docLinks: (job.docLinks ?? []).join("\n"),
    latestSummary: job.latestSummary ?? "",
  });
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const ownerChanged = form.owner !== job.owner;
  const deadlineChanged = form.deadline !== originalDeadlineLocal;
  const needsReason = ownerChanged || deadlineChanged;

  const handleChange = (key: keyof JobFormValues, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);

    if (needsReason && !reason.trim()) {
      setError("การเปลี่ยน Owner หรือ Deadline ต้องมีเหตุผล");
      return;
    }

    const docLinks = form.docLinks
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const patch: JobPatch = {
      customer: form.customer.trim(),
      bookingNumber: orUndefined(form.bookingNumber),
      shipmentType: form.shipmentType,
      serviceType: form.serviceType,
      route: orUndefined(form.route),
      carrier: orUndefined(form.carrier),
      owner: form.owner,
      status: form.status,
      priority: form.priority,
      deadline: toIso(form.deadline) ?? job.deadline,
      etd: toIso(form.etd),
      eta: toIso(form.eta),
      latestSummary: orUndefined(form.latestSummary ?? ""),
      docLinks: docLinks.length > 0 ? docLinks : undefined,
    };

    startTransition(() => {
      editJob(
        job.jobId,
        patch,
        needsReason ? { reason: reason.trim() } : undefined,
      )
        .then(() => {
          router.push(`/jobs/${job.jobId}`);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <JobFormFields
        values={form}
        onChange={handleChange}
        team={team}
        mode="edit"
        ownerDisabled={!canReassign}
        deadlineDisabled={!canChangeDeadline}
      />

      {needsReason ? (
        <Notice title="ต้องมีเหตุผล (High-trust)">
          คุณเปลี่ยน{ownerChanged ? " Owner" : ""}
          {ownerChanged && deadlineChanged ? " และ" : ""}
          {deadlineChanged ? " Deadline" : ""} — กรุณาระบุเหตุผล
          ซึ่งจะบันทึกในประวัติกิจกรรม
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="เหตุผลในการเปลี่ยนแปลง"
            className="mt-2 min-h-[70px] w-full rounded-[9px] border border-input bg-card px-3 py-2 text-sm"
          />
        </Notice>
      ) : null}

      {error ? (
        <p className="text-xs font-semibold text-destructive">{error}</p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 mb-2 flex items-center justify-end gap-2 rounded-[12px] border border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
        <Button
          render={<Link href={`/jobs/${job.jobId}`} />}
          variant="outline"
          className="h-9 rounded-[9px] font-bold"
        >
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="h-9 rounded-[9px] px-4 font-bold"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </Button>
      </div>
    </form>
  );
}
