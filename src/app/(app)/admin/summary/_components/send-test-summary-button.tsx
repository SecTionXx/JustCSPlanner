"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { sendTestSummary } from "../actions";

/**
 * "ส่งสรุปทดสอบ" button — calls the sendTestSummary server action so the
 * current user sees the daily summary land in their notifications bell.
 */
export function SendTestSummaryButton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const [pending, startTransition] = React.useTransition();

  function handleSend(): void {
    startTransition(() => {
      void sendTestSummary();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={pending}
      onClick={handleSend}
      className={cn("rounded-[9px] text-sm font-bold", className)}
    >
      {pending ? "กำลังส่ง…" : "ส่งสรุปทดสอบ"}
    </Button>
  );
}
