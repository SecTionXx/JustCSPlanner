import * as React from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/shell";
import {
  cn,
  daysUntil,
  formatDateTime,
  isNearDeadline,
  isOverdue,
} from "@/lib/utils";
import type { JobCard } from "@/lib/types";

export interface JobCardItemProps {
  job: JobCard;
  className?: string;
}

function deadlineMeta(job: JobCard): {
  label: string;
  tone: "default" | "warn" | "danger";
} {
  const formatted = formatDateTime(job.deadline);
  if (isOverdue(job)) {
    const days = Math.abs(daysUntil(job.deadline));
    return { label: `เกินกำหนด ${days}d · ${formatted}`, tone: "danger" };
  }
  if (isNearDeadline(job)) {
    const hours = Math.max(
      0,
      Math.round((new Date(job.deadline).getTime() - Date.now()) / 3_600_000),
    );
    return { label: `ใกล้ Cut-off ${hours}h · ${formatted}`, tone: "warn" };
  }
  return { label: formatted, tone: "default" };
}

const PRIORITY_TONE: Record<JobCard["priority"], string> = {
  Normal: "#788397",
  High: "#d27b1c",
  Critical: "#c43850",
};

/**
 * Compact card representation of a JobCard for the grid on the Jobs page.
 */
export function JobCardItem({ job, className }: JobCardItemProps): React.ReactElement {
  const meta = deadlineMeta(job);
  const stripeColor = meta.tone === "danger" ? "#f1687e" : meta.tone === "warn" ? "#fb923c" : "transparent";

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className={cn(
        "block rounded-[14px] border bg-white p-4 transition-colors hover:border-[#c9bcf4]",
        className,
      )}
      style={{ borderColor: "var(--border)" }}
    >
      <span
        aria-hidden
        className="mb-3 block h-[5px] w-full rounded-full"
        style={{ backgroundColor: stripeColor }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-[15px] font-bold text-foreground">
            {job.customer}
          </strong>
          {job.route ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {job.route}
            </span>
          ) : null}
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="rounded-full bg-[#f5f3fb] px-2 py-0.5 font-semibold text-foreground">
          {job.shipmentType}
        </span>
        <span className="rounded-full bg-[#f5f3fb] px-2 py-0.5 font-semibold text-foreground">
          {job.serviceType}
        </span>
        {job.bookingNumber ? (
          <span className="rounded-full bg-[#f5f3fb] px-2 py-0.5 text-foreground">
            {job.bookingNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f0eef5] pt-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wide"
          style={{ color: PRIORITY_TONE[job.priority] }}
        >
          {job.priority}
        </span>
        <span
          className={cn(
            "text-[11px] font-semibold",
            meta.tone === "danger" && "text-[#c43850]",
            meta.tone === "warn" && "text-[#d27b1c]",
            meta.tone === "default" && "text-muted-foreground",
          )}
        >
          {meta.label}
        </span>
      </div>
    </Link>
  );
}
