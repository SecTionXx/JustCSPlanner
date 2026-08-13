import * as React from "react"

import { cn } from "@/lib/utils"

/** Color key for a workload segment. */
export type WorkloadKey = "new" | "in_progress" | "done" | "overdue"

export interface WorkloadSegment {
  key: WorkloadKey
  value: number
}

const SEGMENT_COLORS: Record<WorkloadKey, string> = {
  new: "#b6a2f4",
  in_progress: "#53c99b",
  done: "#9fd9f5",
  overdue: "#f28a9d",
}

const LEGEND_LABELS: Record<WorkloadKey, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
  overdue: "Overdue",
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
        "flex h-[25px] w-full overflow-hidden rounded-[7px]",
        className
      )}
      style={{ backgroundColor: "#f1f0f5" }}
      role="img"
      aria-label="workload distribution"
    >
      {total > 0
        ? segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span
                key={s.key}
                className="block h-full"
                style={{
                  backgroundColor: SEGMENT_COLORS[s.key],
                  width: `${(s.value / total) * 100}%`,
                }}
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
    <div className={cn("flex flex-wrap gap-2.5 text-[11px] text-[#748094]", className)}>
      {keys.map((key) => (
        <span key={key} className="inline-flex items-center">
          <span
            aria-hidden
            className="mr-1 inline-block size-2 rounded-[3px]"
            style={{ backgroundColor: SEGMENT_COLORS[key] }}
          />
          {LEGEND_LABELS[key]}
        </span>
      ))}
    </div>
  )
}
