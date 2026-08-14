import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Pulsing placeholder block for loading states.
 */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/** Row of KPI-sized skeleton cards. */
export function KpiSkeleton({ count = 4 }: { count?: number }): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[86px] rounded-[14px]" />
      ))}
    </div>
  )
}
