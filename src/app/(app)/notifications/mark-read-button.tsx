"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { markAllNotificationsRead, markNotificationRead } from "./actions";

interface MarkReadButtonProps {
  notifId: string;
  className?: string;
}

/**
 * Single-row "อ่านแล้ว" button. Calls the markNotificationRead server action and
 * refreshes the route via revalidatePath (inside the action).
 */
export function MarkReadButton({
  notifId,
  className,
}: MarkReadButtonProps): React.ReactElement {
  const [pending, startTransition] = React.useTransition();

  function handleMarkRead(): void {
    startTransition(() => {
      void markNotificationRead(notifId);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleMarkRead}
      className={cn("text-xs", className)}
    >
      {pending ? "กำลังบันทึก…" : "อ่านแล้ว"}
    </Button>
  );
}

/**
 * "อ่านทั้งหมด" button — marks every unread notification for the current user.
 */
export function MarkAllReadButton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const [pending, startTransition] = React.useTransition();

  function handleMarkAll(): void {
    startTransition(() => {
      void markAllNotificationsRead();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleMarkAll}
      className={cn("h-8 rounded-[9px] text-xs font-bold", className)}
    >
      {pending ? "กำลังบันทึก…" : "อ่านทั้งหมด"}
    </Button>
  );
}
