"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Notice,
  OptionChips,
  StepPills,
} from "@/components/shell";
import type { JobDraft } from "@/lib/ai/schema";
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
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

import { createJob } from "../../../actions";
import { AiDraftPanel } from "./ai-draft-panel";

export interface CreateJobFormProps {
  team: TeamMember[];
  /** Renders the AI draft panel only when AI is configured. */
  aiEnabled?: boolean;
  /** Deep-link text (?aiText=) — prefills the AI textarea, never auto-submits. */
  initialAiText?: string;
}

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = JOB_STATUSES
  .filter((s) => s === "New" || s === "In Progress" || s === "Completed")
  .map((s) => ({ value: s, label: s }));

const SHIPMENT_OPTIONS: { value: ShipmentType; label: string }[] = SHIPMENT_TYPES.map(
  (s) => ({ value: s, label: s }),
);

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = PRIORITIES.map((p) => ({
  value: p,
  label: p,
}));

const FORM_FIELD =
  "flex flex-col gap-1.5";

const INPUT_CLASS = "h-9 text-sm";

/** Enum-safe form values derived from an AI JobDraft (null = leave untouched). */
interface AiPrefill {
  title: string;
  customer: string;
  bookingNumber: string;
  route: string;
  deadline: string;
  note: string;
  shipmentType: ShipmentType | null;
  serviceType: ServiceType | null;
}

/** ISO 8601 date (optionally with time and zone) — anything else is rejected. */
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** Convert an ISO date to the datetime-local format; "" when not parseable. */
function toDatetimeLocal(raw: string): string {
  const value = raw.trim();
  if (!ISO_DATE_RE.test(value)) return "";
  if (value.length === 10) return `${value}T00:00`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Only accept values that exist in the system enum; otherwise leave unset. */
function matchShipmentType(value: string): ShipmentType | null {
  const trimmed = value.trim();
  return (SHIPMENT_TYPES as readonly string[]).includes(trimmed)
    ? (trimmed as ShipmentType)
    : null;
}

/**
 * Defensive AI-draft → form mapping. Only enum-safe / parseable values are
 * returned; the apply step skips empty values so user-typed text is never
 * overwritten. Priority stays on its "Normal" default — the draft has none.
 */
function mapDraftToForm(draft: JobDraft): AiPrefill {
  const route = [draft.origin, draft.destination]
    .filter(Boolean)
    .join(" → ");
  const deadline = toDatetimeLocal(draft.deadline);
  const shipmentType = matchShipmentType(draft.shipment_type);
  // Deterministic reverse of the AI mapping rule ("Air Freight" → "Air").
  // Sea types cannot tell Export from Import — leave the form default.
  const serviceType: ServiceType | null =
    shipmentType === "Air" ? "Air Freight" : null;

  const title =
    draft.summary !== ""
      ? draft.summary
      : [draft.customer, route].filter(Boolean).join(" — ");

  let note = draft.summary;
  if (draft.suggested_todos.length > 0) {
    const todoList = draft.suggested_todos
      .map((todo) => `- ${todo}`)
      .join("\n");
    note =
      note === ""
        ? `To-do ที่เสนอ:\n${todoList}`
        : `${note}\n\nTo-do ที่เสนอ:\n${todoList}`;
  }

  return {
    title,
    customer: draft.customer,
    bookingNumber: draft.booking_number,
    route,
    deadline,
    note,
    shipmentType,
    serviceType,
  };
}

export function CreateJobForm({
  team,
  aiEnabled = false,
  initialAiText,
}: CreateJobFormProps): React.ReactElement {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);

  const [title, setTitle] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [bookingNumber, setBookingNumber] = React.useState("");
  const [route, setRoute] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [note, setNote] = React.useState("");
  const [shipmentType, setShipmentType] = React.useState<ShipmentType>("FCL");
  const [serviceType, setServiceType] = React.useState<ServiceType>("Export Sea");
  const [status, setStatus] = React.useState<JobStatus>("New");
  const [priority, setPriority] = React.useState<Priority>("Normal");

  // Deep-link (?aiText=): the textarea keeps the text as its own state, so
  // consume the param once on mount — a refresh must not re-trigger anything.
  React.useEffect(() => {
    if (initialAiText === undefined) return;
    router.replace("/jobs/new");
  }, [initialAiText, router]);

  const handleApplyDraft = (draft: JobDraft): void => {
    const prefill = mapDraftToForm(draft);
    if (prefill.title !== "") setTitle(prefill.title);
    if (prefill.customer !== "") setCustomer(prefill.customer);
    if (prefill.bookingNumber !== "") setBookingNumber(prefill.bookingNumber);
    if (prefill.route !== "") setRoute(prefill.route);
    if (prefill.deadline !== "") setDeadline(prefill.deadline);
    if (prefill.shipmentType !== null) setShipmentType(prefill.shipmentType);
    if (prefill.serviceType !== null) setServiceType(prefill.serviceType);
    if (prefill.note !== "") setNote(prefill.note);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const activeTeam = team.filter((m) => m.active);

  return (
    <div className="flex flex-col gap-4">
      {aiEnabled ? (
        <AiDraftPanel initialText={initialAiText} onApply={handleApplyDraft} />
      ) : null}
      <form ref={formRef} action={createJob} className="flex flex-col gap-4">
        <StepPills
          steps={["ข้อมูลงาน", "มอบหมาย", "สรุป"]}
          current={2}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={cn(FORM_FIELD, "sm:col-span-2")}>
            <Label htmlFor="title" className="text-xs font-bold">
              ชื่องาน / Title <span className="text-[#c43850]">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Export FCL → Singapore (รอ SI)"
              className={INPUT_CLASS}
            />
          </div>

          <div className={FORM_FIELD}>
            <Label htmlFor="customer" className="text-xs font-bold">
              ลูกค้า <span className="text-[#c43850]">*</span>
            </Label>
            <Input
              id="customer"
              name="customer"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="ชื่อบริษัทลูกค้า"
              className={INPUT_CLASS}
            />
          </div>

          <div className={FORM_FIELD}>
            <Label htmlFor="owner" className="text-xs font-bold">
              Assign ให้ <span className="text-[#c43850]">*</span>
            </Label>
            <select
              id="owner"
              name="owner"
              required
              defaultValue=""
              className={cn(
                INPUT_CLASS,
                "rounded-md border bg-white px-2.5",
              )}
              style={{ borderColor: "var(--border)" }}
            >
              <option value="" disabled>
                เลือก CS...
              </option>
              {activeTeam.map((m) => (
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
              name="deadline"
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className={FORM_FIELD}>
            <Label className="text-xs font-bold">สถานะ</Label>
            <OptionChips
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v as JobStatus)}
            />
            <input type="hidden" name="status" value={status} />
          </div>

          <div className={FORM_FIELD}>
            <Label className="text-xs font-bold">Shipment Type</Label>
            <OptionChips
              options={SHIPMENT_OPTIONS}
              value={shipmentType}
              onChange={(v) => setShipmentType(v as ShipmentType)}
            />
            <input type="hidden" name="shipmentType" value={shipmentType} />
          </div>

          <div className={FORM_FIELD}>
            <Label htmlFor="serviceType" className="text-xs font-bold">
              Service Type
            </Label>
            <select
              id="serviceType"
              name="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className={cn(
                INPUT_CLASS,
                "rounded-md border bg-white px-2.5",
              )}
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
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
            />
            <input type="hidden" name="priority" value={priority} />
          </div>

          <div className={FORM_FIELD}>
            <Label htmlFor="bookingNumber" className="text-xs font-bold">
              Booking No.
            </Label>
            <Input
              id="bookingNumber"
              name="bookingNumber"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
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
              name="route"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
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
              name="carrier"
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
              name="etd"
              type="datetime-local"
              className={INPUT_CLASS}
            />
          </div>

          <div className={FORM_FIELD}>
            <Label htmlFor="eta" className="text-xs font-bold">
              ETA
            </Label>
            <Input
              id="eta"
              name="eta"
              type="datetime-local"
              className={INPUT_CLASS}
            />
          </div>

          <div className={cn(FORM_FIELD, "sm:col-span-2")}>
            <Label htmlFor="docLinks" className="text-xs font-bold">
              ลิงก์เอกสาร (ใส่บรรทัดละลิงก์)
            </Label>
            <Textarea
              id="docLinks"
              name="docLinks"
              placeholder={"https://drive.google.com/...\nhttps://..."}
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className={cn(FORM_FIELD, "sm:col-span-2")}>
            <Label htmlFor="note" className="text-xs font-bold">
              Note / หมายเหตุเริ่มต้น
            </Label>
            <Textarea
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ข้อมูลเพิ่มเติมสำหรับ CS ที่รับงาน"
              className="min-h-[70px] text-sm"
            />
          </div>
        </div>

        <Notice title="อัตโนมัติ">
          เมื่อบันทึก ระบบจะสร้าง Job Card พร้อม To-do (ตามเทมเพลตของ Service Type)
          และแจ้ง CS ที่ได้รับมอบหมายอัตโนมัติ
        </Notice>

        <div className="flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Button render={<Link href="/jobs" />} variant="outline" className="h-9 rounded-[9px] font-bold">
            ยกเลิก
          </Button>
          <Button type="submit" className="h-9 rounded-[9px] px-4 font-bold">
            สร้างงานและแจ้ง CS
          </Button>
        </div>
      </form>
    </div>
  );
}
