import * as React from "react"

import { cn } from "@/lib/utils"

export interface StepPillsProps {
  steps: string[]
  /** zero-based index of the active step */
  current: number
  className?: string
}

/**
 * Horizontal step indicator. Active step uses lavender bg + brand text.
 */
export function StepPills({
  steps,
  current,
  className,
}: StepPillsProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {steps.map((step, i) => {
        const active = i === current
        return (
          <span
            key={step}
            className={cn(
              "rounded-full px-2.5 py-[7px] text-xs leading-none",
              active
                ? "font-bold"
                : "text-[#778096]"
            )}
            style={
              active
                ? { backgroundColor: "#e8e0ff", color: "#5b21b6" }
                : { backgroundColor: "#f0eef9" }
            }
          >
            {step}
          </span>
        )
      })}
    </div>
  )
}
