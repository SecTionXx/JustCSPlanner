"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/shell";
import type { JobDraft } from "@/lib/ai/schema";
import { SHIPMENT_TYPES } from "@/lib/enums";
import type { JobStatus, ServiceType, ShipmentType } from "@/lib/enums";
import type { TeamMember } from "@/lib/types";

import { createJob } from "../../../actions";
import {
  JobFormFields,
  type JobFormValues,
} from "../../_components/job-form-fields";
import { AiDraftPanel } from "./ai-draft-panel";

export interface CreateJobFormProps {
  team: TeamMember[];
  /** Renders the AI draft panel only when AI is configured. */
  aiEnabled?: boolean;
  /** Deep-link text (?aiText=) — prefills the AI textarea, never auto-submits. */
  initialAiText?: string;
}

const CREATE_STATUSES: JobStatus[] = ["New", "In Progress", "Completed"];

const INITIAL_VALUES: JobFormValues = {
  title: "",
  customer: "",
  owner: "",
  deadline: "",
  status: "New",
  shipmentType: "FCL",
  serviceType: "Export Sea",
  priority: "Normal",
  bookingNumber: "",
  route: "",
  carrier: "",
  etd: "",
  eta: "",
  docLinks: "",
  note: "",
};

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

  const [values, setValues] = React.useState<JobFormValues>(INITIAL_VALUES);

  // Hidden mirror inputs for fields managed by chips (create form posts via
  // FormData to the createJob server action). serviceType is a native select
  // and submits itself via name="serviceType" in JobFormFields.
  const hidden: Partial<Record<keyof JobFormValues, string>> = {
    status: values.status,
    shipmentType: values.shipmentType,
    priority: values.priority,
  };

  // Deep-link (?aiText=): the textarea keeps the text as its own state, so
  // consume the param once on mount — a refresh must not re-trigger anything.
  React.useEffect(() => {
    if (initialAiText === undefined) return;
    router.replace("/jobs/new");
  }, [initialAiText, router]);

  const handleChange = (key: keyof JobFormValues, value: string): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyDraft = (draft: JobDraft): void => {
    const p = mapDraftToForm(draft);
    setValues((prev) => ({
      ...prev,
      ...(p.title !== "" ? { title: p.title } : {}),
      ...(p.customer !== "" ? { customer: p.customer } : {}),
      ...(p.bookingNumber !== "" ? { bookingNumber: p.bookingNumber } : {}),
      ...(p.route !== "" ? { route: p.route } : {}),
      ...(p.deadline !== "" ? { deadline: p.deadline } : {}),
      ...(p.shipmentType !== null ? { shipmentType: p.shipmentType } : {}),
      ...(p.serviceType !== null ? { serviceType: p.serviceType } : {}),
      ...(p.note !== "" ? { note: p.note } : {}),
    }));
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {aiEnabled ? (
        <AiDraftPanel initialText={initialAiText} onApply={handleApplyDraft} />
      ) : null}

      <form ref={formRef} action={createJob} className="flex flex-col gap-4">
        {Object.entries(hidden).map(([key, value]) =>
          value !== undefined ? (
            <input key={key} type="hidden" name={key} value={value} />
          ) : null,
        )}

        <JobFormFields
          values={values}
          onChange={handleChange}
          team={team}
          mode="create"
          statusSubset={CREATE_STATUSES}
        />

        <Notice title="อัตโนมัติ">
          เมื่อบันทึก ระบบจะสร้าง Job Card พร้อม To-do (ตามเทมเพลตของ Service Type)
          และแจ้ง CS ที่ได้รับมอบหมายอัตโนมัติ
        </Notice>

        <div className="sticky bottom-0 -mx-4 mb-2 flex items-center justify-end gap-2 rounded-[12px] border border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
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
