"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { runScanNow } from "../actions";

/**
 * "รันสแกนตอนนี้" button — calls the runScanNow server action and displays
 * the sent/skipped counts after completion.
 */
export function RunScanButton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{
    sent: number;
    skipped: number;
  } | null>(null);

  function handleRun(): void {
    startTransition(async () => {
      try {
        const res = await runScanNow();
        setResult(res);
      } catch {
        // Server action threw (permission or scan error) — the transition
        // error boundary handles display; reset local state.
        setResult(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={handleRun}
        className={cn("rounded-[9px] text-sm font-bold", className)}
      >
        {pending ? "กำลังสแกน…" : "รันสแกนตอนนี้"}
      </Button>
      {result ? (
        <span className="text-xs text-muted-foreground">
          ส่งแจ้งเตือน {result.sent} รายการ · ข้าม {result.skipped} รายการ
        </span>
      ) : null}
    </div>
  );
}
