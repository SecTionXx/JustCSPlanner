"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptionChips } from "@/components/shell";
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
import { JOB_STATUS_TH, PRIORITY_TH } from "@/lib/labels";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Values rendered by the shared create/edit job form grid.
 * `title` and `note` are create-form fields; edit uses `latestSummary`.
 */
export interface JobFormValues {
  title?: string;
  customer: string;
  owner: string;
  deadline: string;
  status: JobStatus;
  shipmentType: ShipmentType;
  serviceType: ServiceType;
  priority: Priority;
  bookingNumber: string;
  route: string;
  carrier: string;
  etd: string;
  eta: string;
  docLinks: string;
  note?: string;
  latestSummary?: string;
}

export type JobFormKey = keyof JobFormValues;

export interface JobFormFieldsProps {
  values: JobFormValues;
  onChange: (key: JobFormKey, value: string) => void;
  team: TeamMember[];
  /** create mode renders the title field + note textarea; edit renders summary. */
  mode: "create" | "edit";
  /** Restrict statuses to the create-form subset (New/In Progress/Completed). */
  statusSubset?: JobStatus[];
  ownerDisabled?: boolean;
  deadlineDisabled?: boolean;
}

const INPUT_CLASS = "h-9 text-sm";
const REQUIRED = <span className="text-destructive">*</span>;

function FieldWrap({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-bold">
        {label} {required ? REQUIRED : null}
      </Label>
      {children}
    </div>
  );
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }): React.ReactElement {
  return (
    <p className="flex items-center gap-2 text-xs font-bold text-foreground">
      <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] text-secondary-foreground">
        {n}
      </span>
      {children}
    </p>
  );
}

/**
 * Shared sectioned job form grid — single screen, three numbered sections.
 * Used by both the create and edit forms so field markup stays in sync.
 */
export function JobFormFields({
  values,
  onChange,
  team,
  mode,
  statusSubset,
  ownerDisabled,
  deadlineDisabled,
}: JobFormFieldsProps): React.ReactElement {
  const statusOptions = (statusSubset ?? JOB_STATUSES).map((s) => ({
    value: s,
    label: JOB_STATUS_TH[s],
  }));
  const shipmentOptions = SHIPMENT_TYPES.map((s) => ({ value: s, label: s }));
  const priorityOptions = PRIORITIES.map((p) => ({
    value: p,
    label: PRIORITY_TH[p],
  }));

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4">
        <SectionTitle n={1}>ข้อมูลงาน</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {mode === "create" ? (
            <FieldWrap label="ชื่องาน / Title" htmlFor="title" required className="sm:col-span-2">
              <Input
                id="title"
                name="title"
                required
                value={values.title ?? ""}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="เช่น Export FCL → Singapore (รอ SI)"
                className={INPUT_CLASS}
              />
            </FieldWrap>
          ) : null}

          <FieldWrap label="ลูกค้า" htmlFor="customer" required>
            <Input
              id="customer"
              name={mode === "create" ? "customer" : undefined}
              required
              value={values.customer}
              onChange={(e) => onChange("customer", e.target.value)}
              placeholder="ชื่อบริษัทลูกค้า"
              className={INPUT_CLASS}
            />
          </FieldWrap>

          <FieldWrap label="Booking No." htmlFor="bookingNumber">
            <Input
              id="bookingNumber"
              name={mode === "create" ? "bookingNumber" : undefined}
              value={values.bookingNumber}
              onChange={(e) => onChange("bookingNumber", e.target.value)}
              placeholder="BK-xxxxx"
              className={INPUT_CLASS}
            />
          </FieldWrap>

          <FieldWrap label="Shipment Type">
            <OptionChips
              options={shipmentOptions}
              value={values.shipmentType}
              onChange={(v) => onChange("shipmentType", v as string)}
            />
          </FieldWrap>

          <FieldWrap label="Service Type" htmlFor="serviceType">
            <select
              id="serviceType"
              name={mode === "create" ? "serviceType" : undefined}
              value={values.serviceType}
              onChange={(e) => onChange("serviceType", e.target.value)}
              className={cn(INPUT_CLASS, "rounded-md border border-input bg-card px-2.5")}
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap label="Route" htmlFor="route">
            <Input
              id="route"
              name={mode === "create" ? "route" : undefined}
              value={values.route}
              onChange={(e) => onChange("route", e.target.value)}
              placeholder="Bangkok → Singapore"
              className={INPUT_CLASS}
            />
          </FieldWrap>

          <FieldWrap label="Carrier" htmlFor="carrier">
            <Input
              id="carrier"
              name={mode === "create" ? "carrier" : undefined}
              value={values.carrier}
              onChange={(e) => onChange("carrier", e.target.value)}
              placeholder="ONE / Maersk / EVA..."
              className={INPUT_CLASS}
            />
          </FieldWrap>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle n={2}>กำหนดการ</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldWrap label="Deadline" htmlFor="deadline" required>
            <Input
              id="deadline"
              name={mode === "create" ? "deadline" : undefined}
              type="datetime-local"
              required
              value={values.deadline}
              onChange={(e) => onChange("deadline", e.target.value)}
              disabled={deadlineDisabled}
              className={INPUT_CLASS}
            />
          </FieldWrap>
          <FieldWrap label="ETD" htmlFor="etd">
            <Input
              id="etd"
              name={mode === "create" ? "etd" : undefined}
              type="datetime-local"
              value={values.etd}
              onChange={(e) => onChange("etd", e.target.value)}
              className={INPUT_CLASS}
            />
          </FieldWrap>
          <FieldWrap label="ETA" htmlFor="eta">
            <Input
              id="eta"
              name={mode === "create" ? "eta" : undefined}
              type="datetime-local"
              value={values.eta}
              onChange={(e) => onChange("eta", e.target.value)}
              className={INPUT_CLASS}
            />
          </FieldWrap>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle n={3}>ผู้รับผิดชอบ & สถานะ</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrap label="Assign ให้" htmlFor="owner" required>
            <select
              id="owner"
              name={mode === "create" ? "owner" : undefined}
              required
              value={values.owner}
              onChange={(e) => onChange("owner", e.target.value)}
              disabled={ownerDisabled}
              className={cn(INPUT_CLASS, "rounded-md border border-input bg-card px-2.5")}
            >
              {mode === "create" ? (
                <option value="" disabled>
                  เลือก CS...
                </option>
              ) : null}
              {team.map((m) =>
                mode === "create" && !m.active ? null : (
                  <option key={m.csId} value={m.csId}>
                    {m.displayName} ({m.role})
                  </option>
                ),
              )}
            </select>
          </FieldWrap>

          <FieldWrap label="สถานะ">
            <OptionChips
              options={statusOptions}
              value={values.status}
              onChange={(v) => onChange("status", v as string)}
            />
          </FieldWrap>

          <FieldWrap label="ความสำคัญ">
            <OptionChips
              options={priorityOptions}
              value={values.priority}
              onChange={(v) => onChange("priority", v as string)}
            />
          </FieldWrap>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle n={4}>เอกสาร & Note</SectionTitle>
        <div className="grid grid-cols-1 gap-4">
          <FieldWrap label="ลิงก์เอกสาร (ใส่บรรทัดละลิงก์)" htmlFor="docLinks">
            <Textarea
              id="docLinks"
              name={mode === "create" ? "docLinks" : undefined}
              value={values.docLinks}
              onChange={(e) => onChange("docLinks", e.target.value)}
              placeholder={"https://drive.google.com/...\nhttps://..."}
              className="min-h-[60px] text-sm"
            />
          </FieldWrap>

          {mode === "create" ? (
            <FieldWrap label="Note / หมายเหตุเริ่มต้น" htmlFor="note">
              <Textarea
                id="note"
                name="note"
                value={values.note ?? ""}
                onChange={(e) => onChange("note", e.target.value)}
                placeholder="ข้อมูลเพิ่มเติมสำหรับ CS ที่รับงาน"
                className="min-h-[70px] text-sm"
              />
            </FieldWrap>
          ) : (
            <FieldWrap label="Note / สรุปล่าสุด" htmlFor="latestSummary">
              <Textarea
                id="latestSummary"
                value={values.latestSummary ?? ""}
                onChange={(e) => onChange("latestSummary", e.target.value)}
                placeholder="ข้อมูลเพิ่มเติมสำหรับ CS"
                className="min-h-[70px] text-sm"
              />
            </FieldWrap>
          )}
        </div>
      </section>
    </div>
  );
}
