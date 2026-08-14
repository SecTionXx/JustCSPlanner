import * as React from "react";

import { cn } from "@/lib/utils";
import { PRIORITY_CLASSES, PRIORITY_TH } from "@/lib/labels";
import type { Priority } from "@/lib/enums";

export interface PriorityBadgeProps {
  priority: string;
  /** Override the displayed label; otherwise the Thai label is shown. */
  label?: string;
  className?: string;
}

/** Pill badge for a job priority — Thai label + semantic token colors. */
export function PriorityBadge({
  priority,
  label,
  className,
}: PriorityBadgeProps): React.ReactElement {
  const resolved = (["Normal", "High", "Critical"] as const).includes(
    priority as Priority
  )
    ? (priority as Priority)
    : "Normal";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold leading-none whitespace-nowrap",
        PRIORITY_CLASSES[resolved],
        className
      )}
    >
      {label ?? PRIORITY_TH[resolved]}
    </span>
  );
}
