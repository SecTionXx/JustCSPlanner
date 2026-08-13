import * as React from "react"

import { cn } from "@/lib/utils"

export type KpiTone = "default" | "new" | "ok" | "warn" | "danger"

const TONE_TEXT: Record<KpiTone, string> = {
  default: "",
  new: "#7050d6",
  ok: "#177a55",
  warn: "#d27b1c",
  danger: "#c43850",
}

export interface KpiCardProps {
  label: string
  value: React.ReactNode
  tone?: KpiTone
  className?: string
}

/**
 * Small white KPI card: muted caption + big bold value.
 */
export function KpiCard({
  label,
  value,
  tone = "default",
  className,
}: KpiCardProps): React.ReactElement {
  const valueColor = TONE_TEXT[tone]

  return (
    <div
      className={cn(
        "rounded-[14px] border bg-white p-[15px]",
        className
      )}
      style={{ borderColor: "var(--border)" }}
    >
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong
        className="mt-1 block text-[23px] font-bold leading-tight"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </strong>
    </div>
  )
}
