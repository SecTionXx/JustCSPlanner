import * as React from "react"

import { cn } from "@/lib/utils"

/** Color key for a workload segment. */
export type WorkloadKey = "new" | "in_progress" | "done" | "overdue"

export interface WorkloadSegment {
  key: WorkloadKey
  value: number
}

const SEGMENT_CLASSES: Record<WorkloadKey, string> = {
  new: "bg-status-new",
  in_progress: "bg-status-progress",
  done: "bg-status-completed",
  overdue: "bg-status-blocked",
}

const LEGEND_LABELS: Record<WorkloadKey, string> = {
  new: "ใหม่",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จแล้ว",
  overdue: "เกินกำหนด",
}

export interface WorkloadBarProps {
  segments: WorkloadSegment[]
  className?: string
}

/**
 * Segmented horizontal rail showing CS workload distribution.
 * Segments normalize to percentages of the total.
 */
export function WorkloadBar({
  segments,
  className,
}: WorkloadBarProps): React.ReactElement {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div
      className={cn(
        "flex h-[25px] w-full overflow-hidden rounded-[7px] bg-muted",
        className
      )}
      role="img"
      aria-label="workload distribution"
    >
      {total > 0
        ? segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span
                key={s.key}
                className={cn("block h-full", SEGMENT_CLASSES[s.key])}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ))
        : null}
    </div>
  )
}

export interface WorkloadLegendProps {
  keys?: WorkloadKey[]
  className?: string
}

/**
 * Inline legend for the WorkloadBar.
 */
export function WorkloadLegend({
  keys = ["new", "in_progress", "done", "overdue"],
  className,
}: WorkloadLegendProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap gap-2.5 text-[11px] text-muted-foreground", className)}>
      {keys.map((key) => (
        <span key={key} className="inline-flex items-center">
          <span
            aria-hidden
            className={cn(
              "mr-1 inline-block size-2 rounded-[3px]",
              SEGMENT_CLASSES[key]
            )}
          />
          {LEGEND_LABELS[key]}
        </span>
      ))}
    </div>
  )
}
