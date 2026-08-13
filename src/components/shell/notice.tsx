import * as React from "react"

import { cn } from "@/lib/utils"

export interface NoticeProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Amber info box with a leading ✦ marker.
 */
export function Notice({
  title,
  children,
  className,
}: NoticeProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-[9px] border px-3 py-[10px] text-xs leading-relaxed",
        className
      )}
      style={{
        backgroundColor: "var(--notice-bg)",
        borderColor: "var(--notice-border)",
        color: "var(--notice-text)",
      }}
    >
      <span aria-hidden className="mr-1 font-bold">
        ✦
      </span>
      {title ? <strong className="font-bold">{title}: </strong> : null}
      <span>{children}</span>
    </div>
  )
}
