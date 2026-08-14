"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ignoreEmail, linkEmailToJob } from "../actions";

/** Job option shape passed from the RSC page (jobId + customer label fields). */
export interface JobOption {
  jobId: string;
  customer: string;
  bookingNumber?: string;
}

export interface EmailRowActionsProps {
  emailId: string;
  jobs: JobOption[];
  /** Heuristic preselection (booking/customer match) — best-effort only. */
  suggestedJobId?: string;
  /**
   * Link to /jobs/new?aiText=... Built server-side; omit to hide the AI action
   * (AI disabled).
   */
  aiHref?: string;
  className?: string;
}

/**
 * Per-row actions: เชื่อมกับงาน (job select + linkEmailToJob server action),
 * ร่างงานใหม่ (AI — link only, shown when aiHref is set), ข้าม (ignoreEmail).
 */
export function EmailRowActions({
  emailId,
  jobs,
  suggestedJobId,
  aiHref,
  className,
}: EmailRowActionsProps): React.ReactElement {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  function run(action: () => Promise<void>): void {
    startTransition(async () => {
      try {
        setError(null);
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  function handleLink(): void {
    const jobId = selectRef.current?.value ?? "";
    if (!jobId) {
      setError("กรุณาเลือกงานก่อนเชื่อม");
      return;
    }
    run(() => linkEmailToJob(emailId, jobId));
  }

  function handleIgnore(): void {
    run(() => ignoreEmail(emailId));
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          ref={selectRef}
          defaultValue={suggestedJobId ?? ""}
          disabled={pending || jobs.length === 0}
          className="h-8 min-w-52 max-w-full rounded-md border bg-white px-2 text-xs"
          style={{ borderColor: "var(--border)" }}
          aria-label="เลือกงานที่จะเชื่อม"
        >
          <option value="" disabled>
            {jobs.length === 0 ? "ไม่มีงานให้เชื่อม" : "เลือกงาน (Job ID — ลูกค้า)..."}
          </option>
          {jobs.map((job) => (
            <option key={job.jobId} value={job.jobId}>
              {job.jobId} — {job.customer}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          disabled={pending || jobs.length === 0}
          onClick={handleLink}
          className="h-8 rounded-[9px] text-xs font-bold"
        >
          {pending ? "กำลังเชื่อม…" : "เชื่อมกับงาน"}
        </Button>
        {aiHref ? (
          <Button
            render={<Link href={aiHref} />}
            variant="outline"
            size="sm"
            className="h-8 rounded-[9px] text-xs font-bold"
          >
            ร่างงานใหม่ (AI)
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={handleIgnore}
          className="h-8 text-xs"
        >
          ข้าม
        </Button>
      </div>
      {error ? (
        <span className="text-[11px] font-semibold text-[#c43850]">{error}</span>
      ) : suggestedJobId ? (
        <span className="text-[11px] text-muted-foreground">
          แนะนำจากเลข booking หรือชื่อลูกค้าที่พบในข้อความ
        </span>
      ) : null}
    </div>
  );
}
