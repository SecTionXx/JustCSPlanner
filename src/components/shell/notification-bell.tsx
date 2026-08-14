"use client"

import * as React from "react"
import Link from "next/link"
import { BellIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface NotificationBellProps {
  /** Unread notification count for the current user (server-fetched). */
  unreadCount?: number
  className?: string
}

/**
 * Bell icon with an unread badge. Links to /notifications. The unread count is
 * fetched server-side in the (app) layout and passed down so the bell stays in
 * sync on navigation (the layout re-runs per request under force-dynamic).
 */
export function NotificationBell({
  unreadCount = 0,
  className,
}: NotificationBellProps): React.ReactElement {
  const badge = unreadCount > 9 ? "9+" : String(unreadCount)
  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `การแจ้งเตือน (${unreadCount} ยังไม่อ่าน)` : "การแจ้งเตือน"}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-[9px] text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      <BellIcon className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}
