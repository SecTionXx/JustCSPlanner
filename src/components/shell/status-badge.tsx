import * as React from "react";

import { cn } from "@/lib/utils";
import { JOB_STATUS_CLASSES, JOB_STATUS_TH, toJobStatus } from "@/lib/labels";

/**
 * Classify a free-form status string for deadline-ish tones.
 * Kept for consumers that highlight overdue / due-soon rows.
 */
export type StatusCategory = "new" | "in_progress" | "done" | "warning" | "danger" | "waiting";

export function classifyStatus(status: string): StatusCategory {
  const s = status.trim().toLowerCase();
  if (!s) return "new";

  if (
    /(overdue|เกินกำหนด|งานค้าง|เลยกำหนด|blocked|needs help|ติดอยู่|ช่วยเหลือ)/.test(s)
  ) {
    return "danger";
  }
  if (/(due soon|ใกล้|cut[- ]?off|ใกล้ deadline|ใกล้กำหนด|warning|warn)/.test(s)) {
    return "warning";
  }
  if (/(waiting|รอลูกค้า|รอเอกสาร|รอ|waiting on)/.test(s)) {
    return "waiting";
  }
  if (/(done|completed|เสร็จ|สำเร็จ|complete|ปกติ)/.test(s)) {
    return "done";
  }
  if (/(in progress|กำลังดำเนิน|progress|ดำเนินการ|ongoing|processing)/.test(s)) {
    return "in_progress";
  }
  if (/(new|ใหม่|ร่าง|draft)/.test(s)) {
    return "new";
  }
  return "in_progress";
}

/** Tailwind text/bg class pair per deadline tone (danger/warning). */
export const TONE_CLASSES: Record<"danger" | "warning", string> = {
  danger: "bg-tone-danger-soft text-tone-danger",
  warning: "bg-tone-warning-soft text-tone-warning",
};

export interface StatusBadgeProps {
  status: string;
  /** Override the displayed label; otherwise the Thai label is shown. */
  label?: string;
  className?: string;
}

/**
 * Pill badge for a job status — renders the Thai label with semantic
 * token colors. Unknown strings fall back via `toJobStatus`.
 */
export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps): React.ReactElement {
  const resolved = toJobStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-semibold leading-none whitespace-nowrap",
        JOB_STATUS_CLASSES[resolved],
        className
      )}
    >
      {label ?? JOB_STATUS_TH[resolved]}
    </span>
  );
}
