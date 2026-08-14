import * as React from "react"

import { cn } from "@/lib/utils"

export type KpiTone = "default" | "new" | "ok" | "warn" | "danger"

const TONE_TEXT: Record<KpiTone, string> = {
  default: "text-foreground",
  new: "text-status-new",
  ok: "text-status-completed",
  warn: "text-status-needs-help",
  danger: "text-status-blocked",
}

export interface KpiCardProps {
  label: string
  value: React.ReactNode
  tone?: KpiTone
  /** when provided, the card links to this href */
  href?: string
  className?: string
}

/**
 * Small KPI card: muted caption + big bold value, tone-colored.
 * Renders as a link when `href` is set.
 */
export function KpiCard({
  label,
  value,
  tone = "default",
  href,
  className,
}: KpiCardProps): React.ReactElement {
  const body = (
    <div
      className={cn(
        "rounded-[14px] border bg-card text-card-foreground p-[15px] transition-colors",
        href && "hover:border-primary/40",
        className
      )}
    >
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong
        className={cn(
          "mt-1 block text-[23px] font-bold leading-tight",
          TONE_TEXT[tone]
        )}
      >
        {value}
      </strong>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-[14px] focus-visible:outline-2 focus-visible:outline-ring"
      >
        {body}
      </a>
    )
  }

  return body
}
