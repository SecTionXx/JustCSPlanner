import * as React from "react"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"

export interface NoticeProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Amber info box with a leading info icon.
 */
export function Notice({
  title,
  children,
  className,
}: NoticeProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-[9px] border border-notice-border bg-notice-bg px-3 py-[10px] text-xs leading-relaxed text-notice-text",
        className
      )}
    >
      <Info aria-hidden className="mr-1 inline size-3.5 -translate-y-px" />
      {title ? <strong className="font-bold">{title}: </strong> : null}
      <span>{children}</span>
    </div>
  )
}
