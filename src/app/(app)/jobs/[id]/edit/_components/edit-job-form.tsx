"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Notice, OptionChips } from "@/components/shell";
import {
  JOB_STATUSES,
  PRIORITIES,
  SERVICE_TYPES,
  SHIPMENT_TYPES,
  type JobStatus,
  type Priority,
  type ServiceType,
  type ShipmentType,
} from "@/lib/enums";
import type { JobCard, JobPatch, TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

import { editJob } from "../../../../actions";

export interface EditJobFormProps {
  job: JobCard;
  team: TeamMember[];
  /** Whether the user may change the job owner (lead/admin). */
  canReassign: boolean;
  /** Whether the user may change the deadline (lead/admin). */
  canChangeDeadline: boolean;
}

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = JOB_STATUSES.map(
  (s) => ({ value: s, label: s }),
);

const SHIPMENT_OPTIONS: { value: ShipmentType; label: string }[] =
  SHIPMENT_TYPES.map((s) => ({ value: s, label: s }));

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = PRIORITIES.map(
  (p) => ({ value: p, label: p }),
);

const FORM_FIELD = "flex flex-col gap-1.5";
const INPUT_CLASS = "h-9 text-sm";

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

  const [form, setForm] = React.useState({
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

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ): void => {
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
      latestSummary: orUndefined(form.latestSummary),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="customer" className="text-xs font-bold">
            ลูกค้า <span className="text-[#c43850]">*</span>
          </Label>
          <Input
            id="customer"
            required
            value={form.customer}
            onChange={(e) => update("customer", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="owner" className="text-xs font-bold">
            Assign ให้ <span className="text-[#c43850]">*</span>
          </Label>
          <select
            id="owner"
            required
            value={form.owner}
            onChange={(e) => update("owner", e.target.value)}
            disabled={!canReassign}
            className={cn(INPUT_CLASS, "rounded-md border bg-white px-2.5")}
            style={{ borderColor: "var(--border)" }}
          >
            {team.map((m) => (
              <option key={m.csId} value={m.csId}>
                {m.displayName} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="deadline" className="text-xs font-bold">
            Deadline <span className="text-[#c43850]">*</span>
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            required
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            disabled={!canChangeDeadline}
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">สถานะ</Label>
          <OptionChips
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => update("status", v as JobStatus)}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">Shipment Type</Label>
          <OptionChips
            options={SHIPMENT_OPTIONS}
            value={form.shipmentType}
            onChange={(v) => update("shipmentType", v as ShipmentType)}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="serviceType" className="text-xs font-bold">
            Service Type
          </Label>
          <select
            id="serviceType"
            value={form.serviceType}
            onChange={(e) => update("serviceType", e.target.value as ServiceType)}
            className={cn(INPUT_CLASS, "rounded-md border bg-white px-2.5")}
            style={{ borderColor: "var(--border)" }}
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">Priority</Label>
          <OptionChips
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(v) => update("priority", v as Priority)}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="bookingNumber" className="text-xs font-bold">
            Booking No.
          </Label>
          <Input
            id="bookingNumber"
            value={form.bookingNumber}
            onChange={(e) => update("bookingNumber", e.target.value)}
            placeholder="BK-xxxxx"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="route" className="text-xs font-bold">
            Route
          </Label>
          <Input
            id="route"
            value={form.route}
            onChange={(e) => update("route", e.target.value)}
            placeholder="Bangkok → Singapore"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="carrier" className="text-xs font-bold">
            Carrier
          </Label>
          <Input
            id="carrier"
            value={form.carrier}
            onChange={(e) => update("carrier", e.target.value)}
            placeholder="ONE / Maersk / EVA..."
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="etd" className="text-xs font-bold">
            ETD
          </Label>
          <Input
            id="etd"
            type="datetime-local"
            value={form.etd}
            onChange={(e) => update("etd", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="eta" className="text-xs font-bold">
            ETA
          </Label>
          <Input
            id="eta"
            type="datetime-local"
            value={form.eta}
            onChange={(e) => update("eta", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="docLinks" className="text-xs font-bold">
            ลิงก์เอกสาร (ใส่บรรทัดละลิงก์)
          </Label>
          <Textarea
            id="docLinks"
            value={form.docLinks}
            onChange={(e) => update("docLinks", e.target.value)}
            placeholder={"https://drive.google.com/...\nhttps://..."}
            className="min-h-[60px] text-sm"
          />
        </div>

        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="latestSummary" className="text-xs font-bold">
            Note / สรุปล่าสุด
          </Label>
          <Textarea
            id="latestSummary"
            value={form.latestSummary}
            onChange={(e) => update("latestSummary", e.target.value)}
            placeholder="ข้อมูลเพิ่มเติมสำหรับ CS"
            className="min-h-[70px] text-sm"
          />
        </div>
      </div>

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
            className="mt-2 min-h-[70px] w-full rounded-[9px] border bg-white px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </Notice>
      ) : null}

      {error ? (
        <p className="text-xs font-semibold text-[#c43850]">{error}</p>
      ) : null}

      <div
        className="flex items-center justify-end gap-2 border-t pt-3"
        style={{ borderColor: "var(--border)" }}
      >
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
