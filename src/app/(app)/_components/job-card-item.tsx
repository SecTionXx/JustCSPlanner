import * as React from "react";
import Link from "next/link";
import { ArrowRight, MoveRight } from "lucide-react";

import {
  PersonaAvatar,
  PriorityBadge,
  StatusBadge,
} from "@/components/shell";
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

const DEADLINE_TONE: Record<"default" | "warn" | "danger", string> = {
  default: "bg-muted text-muted-foreground",
  warn: "bg-tone-warning-soft text-tone-warning font-semibold",
  danger: "bg-tone-danger-soft text-tone-danger font-semibold",
};

/**
 * Compact card representation of a JobCard for the grid on the Jobs page.
 */
export function JobCardItem({ job, className }: JobCardItemProps): React.ReactElement {
  const meta = deadlineMeta(job);

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className={cn(
        "block rounded-[14px] border bg-card text-card-foreground p-4 transition-colors hover:border-primary/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-[15px] font-bold text-foreground">
            {job.customer}
          </strong>
          <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
            {job.jobId}
            {job.bookingNumber ? ` · ${job.bookingNumber}` : ""}
          </span>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {job.route ? (
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-foreground/80">
          <MoveRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          {job.route}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
          {job.shipmentType}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
          {job.serviceType}
        </span>
        <PriorityBadge priority={job.priority} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <PersonaAvatar name={job.owner} size="sm" />
          <span className="truncate text-[11px] text-muted-foreground">{job.owner}</span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
            DEADLINE_TONE[meta.tone],
          )}
        >
          {meta.label}
        </span>
      </div>
    </Link>
  );
}

/**
 * Dense single-line row for the list view on the Jobs page.
 */
export function JobListItem({ job, className }: JobCardItemProps): React.ReactElement {
  const meta = deadlineMeta(job);

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className={cn(
        "flex items-center gap-3 rounded-[10px] border bg-card px-3 py-2.5 transition-colors hover:border-primary/50",
        className,
      )}
    >
      <PersonaAvatar name={job.owner} size="sm" />
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-[13px] font-semibold text-foreground">
          {job.customer}
        </strong>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">
          {job.jobId}
          {job.bookingNumber ? ` · ${job.bookingNumber}` : ""}
          {job.route ? ` · ${job.route}` : ""}
        </span>
      </div>
      <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground md:inline">
        {job.shipmentType}
      </span>
      <PriorityBadge priority={job.priority} className="hidden shrink-0 sm:inline-flex" />
      <StatusBadge status={job.status} />
      <span
        className={cn(
          "hidden w-44 shrink-0 truncate rounded-full px-2 py-0.5 text-right text-[11px] lg:inline-flex",
          DEADLINE_TONE[meta.tone],
        )}
      >
        {meta.label}
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
