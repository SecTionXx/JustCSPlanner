"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JobDraft } from "@/lib/ai/schema";

import { draftJobFromText } from "../actions";

/** Keep in sync with the server-side cap in ../actions. */
const MAX_TEXT_LENGTH = 8_000;

const CONFIDENCE_LABELS: Record<JobDraft["confidence"], string> = {
  high: "สูง",
  medium: "กลาง",
  low: "ต่ำ",
};

const CONFIDENCE_CLASSES: Record<JobDraft["confidence"], string> = {
  high: "bg-status-completed-soft text-status-completed",
  medium: "bg-status-needs-help-soft text-status-needs-help",
  low: "bg-status-blocked-soft text-status-blocked",
};

function Field({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value || "—"}</span>
    </div>
  );
}

export interface AiDraftPanelProps {
  /** Prefills the textarea (deep-link ?aiText=). Does NOT auto-submit. */
  initialText?: string;
  /** Called with the validated draft when the user presses "ใช้ร่างนี้". */
  onApply: (draft: JobDraft) => void;
}

/**
 * Collapsible "draft from pasted text" panel for the create-job page.
 * AI proposes — the human reviews here and still presses the real submit
 * button. Nothing is saved by this panel.
 */
export function AiDraftPanel({
  initialText = "",
  onApply,
}: AiDraftPanelProps): React.ReactElement {
  const [open, setOpen] = React.useState(initialText !== "");
  const [text, setText] = React.useState(initialText);
  const [draft, setDraft] = React.useState<JobDraft | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const canDraft = !pending && text.trim() !== "";

  const handleDraft = (): void => {
    if (!canDraft) return;
    const value = text.trim();
    startTransition(async () => {
      const result = await draftJobFromText(value);
      if (!result.enabled) {
        setError("ฟีเจอร์ AI ไม่ได้เปิดใช้งาน");
        setDraft(null);
        return;
      }
      if (result.error || result.draft === undefined) {
        setError(result.error ?? "ร่างงานจาก AI ไม่สำเร็จ กรุณาลองอีกครั้ง");
        setDraft(null);
        return;
      }
      setError(null);
      setDraft(result.draft);
    });
  };

  const handleApply = (): void => {
    if (draft === null) return;
    onApply(draft);
    setDraft(null);
    setOpen(false);
  };

  const handleDismiss = (): void => {
    setDraft(null);
    setError(null);
  };

  return (
    <div className="rounded-[12px] border border-primary/25 bg-secondary/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-[12px] px-3.5 py-2.5 text-left"
      >
        <span className="text-sm font-bold text-primary">
          ร่างจากข้อความ (AI)
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {open ? "ปิด ▲" : "เปิด ▼"}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            วางข้อความ / อีเมล booking แล้วให้ AI ช่วยร่างข้อมูลงาน —
            ระบบจะไม่บันทึกอะไรจนกว่าคุณจะตรวจสอบและกดสร้างงานเอง
          </p>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            placeholder={"วางข้อความที่นี่ เช่น\n\nคุณ ABC แจ้ง booking FCL BKK123 ไป Singapore ส่ง SI ก่อน 21 ส.ค. ..."}
            className="min-h-[120px] bg-card text-sm"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              สูงสุด {MAX_TEXT_LENGTH.toLocaleString("th-TH")} ตัวอักษร
            </span>
            <Button
              type="button"
              onClick={handleDraft}
              disabled={!canDraft}
              className="h-8 rounded-[7px] px-2.5 text-xs font-bold"
            >
              {pending ? "กำลังร่าง..." : "ร่างงาน"}
            </Button>
          </div>

          {error ? (
            <p
              className="rounded-[9px] border border-destructive/30 bg-status-blocked-soft px-3 py-2 text-xs leading-relaxed text-status-blocked"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {draft ? (
            <div className="rounded-[12px] border border-primary/30 bg-secondary/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-bold text-primary">
                  ร่างจาก AI — ตรวจสอบก่อนใช้
                </strong>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${CONFIDENCE_CLASSES[draft.confidence]}`}
                >
                  ความมั่นใจ: {CONFIDENCE_LABELS[draft.confidence]}
                </span>
              </div>

              <div className="mt-2.5 rounded-[10px] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-foreground">
                <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <Field label="ลูกค้า" value={draft.customer} />
                  <Field label="Booking No." value={draft.booking_number} />
                  <Field
                    label="Route"
                    value={
                      draft.origin || draft.destination
                        ? [draft.origin, draft.destination].filter(Boolean).join(" → ")
                        : ""
                    }
                  />
                  <Field label="Deadline" value={draft.deadline} />
                  <Field label="Shipment Type" value={draft.shipment_type} />
                </div>

                {draft.summary ? (
                  <p className="mt-2 border-t border-border pt-2">
                    {draft.summary}
                  </p>
                ) : null}

                {draft.suggested_todos.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-[12px] text-muted-foreground">
                    {draft.suggested_todos.map((todo) => (
                      <li key={todo}>{todo}</li>
                    ))}
                  </ul>
                ) : null}

                {draft.missing_information.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.missing_information.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-notice-border bg-notice-bg px-2 py-0.5 text-[11px] text-notice-text"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleApply}
                  className="h-8 rounded-[7px] px-2.5 text-xs font-bold"
                >
                  ใช้ร่างนี้
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 rounded-[7px] px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  แก้ไขเอง
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
