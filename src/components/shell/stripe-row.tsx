import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type StripeTone = "red" | "orange" | "green" | "purple"

const STRIPE_COLORS: Record<StripeTone, string> = {
  red: "#f1687e",
  orange: "#fb923c",
  green: "#4fcf9b",
  purple: "#ad8bea",
}

export interface StripeRowProps {
  tone: StripeTone
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** trailing meta (tag, time, etc.) */
  meta?: React.ReactNode
  /** when provided, the whole row is wrapped in a Link */
  href?: string
  className?: string
}

/**
 * List row with a colored left bar. Optionally links out.
 */
export function StripeRow({
  tone,
  title,
  subtitle,
  meta,
  href,
  className,
}: StripeRowProps): React.ReactElement {
  const body = (
    <div className="flex items-center gap-2.5 py-[11px] first:pt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-[#f0eff5]">
      <span
        aria-hidden
        className="block h-[39px] w-[9px] shrink-0 rounded-[7px]"
        style={{ backgroundColor: STRIPE_COLORS[tone] }}
      />
      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-foreground">
          {title}
        </strong>
        {subtitle ? (
          <small className="mt-[3px] block text-xs text-[#788397]">
            {subtitle}
          </small>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn("block transition-opacity hover:opacity-80", className)}
      >
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}
