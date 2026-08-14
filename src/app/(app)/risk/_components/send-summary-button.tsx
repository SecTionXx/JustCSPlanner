"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendTestSummary } from "@/app/(app)/admin/summary/actions";

/**
 * Sends the daily risk digest via the existing summary action (reused, not
 * duplicated). Shows pending state; errors surface via alert text.
 */
export function SendSummaryButton(): React.ReactElement {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  function handleClick(): void {
    setError(null);
    setDone(false);
    startTransition(() => {
      sendTestSummary()
        .then(() => setDone(true))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "ส่งสรุปไม่สำเร็จ");
        });
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={pending}
        onClick={handleClick}
        className="h-9 rounded-[9px] text-sm font-bold"
      >
        <Send aria-hidden className="size-4" />
        {pending ? "กำลังส่ง..." : "ส่งสรุปให้ทีม"}
      </Button>
      {done ? (
        <span className="text-[11px] font-semibold text-status-completed">
          ส่งสรุปแล้ว
        </span>
      ) : null}
      {error ? (
        <span className="text-[11px] font-semibold text-destructive">{error}</span>
      ) : null}
    </span>
  );
}
