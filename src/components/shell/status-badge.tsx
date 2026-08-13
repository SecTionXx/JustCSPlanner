import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusCategory =
  | "new"
  | "in_progress"
  | "done"
  | "warning"
  | "danger"
  | "waiting"

export interface StatusStyle {
  /** soft background color */
  soft: string
  /** text color */
  text: string
  /** Thai label fallback */
  label: string
}

/**
 * Mapping from status category → soft bg + text color pair.
 * Reused by pages and other components.
 */
export const STATUS_STYLES: Record<StatusCategory, StatusStyle> = {
  new: { soft: "#eee9ff", text: "#7050d6", label: "New" },
  in_progress: { soft: "#def7eb", text: "#177a55", label: "In Progress" },
  done: { soft: "#e3f3fb", text: "#1d6fa5", label: "Done" },
  warning: { soft: "#fff0df", text: "#d27b1c", label: "Due soon" },
  danger: { soft: "#ffe4e8", text: "#c43850", label: "Overdue" },
  waiting: { soft: "#f3efff", text: "#7c3aed", label: "Waiting" },
}

/**
 * Classify a free-form status string into a status category.
 * Order matters — check danger/warning before generic terms.
 */
export function classifyStatus(status: string): StatusCategory {
  const s = status.trim().toLowerCase()
  if (!s) return "new"

  if (
    /(overdue|เกินกำหนด|งานค้าง|เลยกำหนด|blocked|needs help|ติดอยู่|ช่วยเหลือ)/.test(
      s
    )
  ) {
    return "danger"
  }
  if (/(due soon|ใกล้|cut[- ]?off|ใกล้ deadline|ใกล้กำหนด|warning|warn)/.test(s)) {
    return "warning"
  }
  if (/(waiting|รอลูกค้า|รอเอกสาร|รอ|waiting on)/.test(s)) {
    return "waiting"
  }
  if (/(done|completed|เสร็จ|สำเร็จ|complete|ปกติ)/.test(s)) {
    return "done"
  }
  if (/(in progress|กำลังดำเนิน|progress|ดำเนินการ|ongoing|processing)/.test(s)) {
    return "in_progress"
  }
  if (/(new|ใหม่|ร่าง|draft)/.test(s)) {
    return "new"
  }
  return "in_progress"
}

export interface StatusBadgeProps {
  status: string
  /** Override the category lookup; otherwise derived from `status`. */
  category?: StatusCategory
  /** Override the displayed label; otherwise the raw `status` is shown. */
  label?: string
  className?: string
}

/**
 * Pill badge that maps a status string to the lavender-purple status palette.
 */
export function StatusBadge({
  status,
  category,
  label,
  className,
}: StatusBadgeProps): React.ReactElement {
  const resolved = category ?? classifyStatus(status)
  const style = STATUS_STYLES[resolved]
  const display = label ?? status

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-bold leading-none whitespace-nowrap",
        className
      )}
      style={{ backgroundColor: style.soft, color: style.text }}
    >
      {display}
    </span>
  )
}
