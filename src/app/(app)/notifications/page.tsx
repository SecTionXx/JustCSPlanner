import Link from "next/link";
import { BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ACTIVITY_EVENT_TH, ACTIVITY_EVENT_TONE } from "@/lib/labels";
import { getRepository } from "@/lib/repository";
import { cn, formatDateTime } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/enums";
import type { Notification } from "@/lib/types";

import { PageHeader, Panel } from "../_components/field";
import { MarkAllReadButton, MarkReadButton } from "./mark-read-button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const sp = await searchParams;
  const filter = (Array.isArray(sp.filter) ? sp.filter[0] : sp.filter) ?? "all";

  const user = await getCurrentUser();
  const repo = getRepository();
  const notifications = await repo.listNotifications(user.csId);

  // Newest first.
  const sorted = [...notifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const unreadCount = sorted.filter((n) => n.status !== "read").length;
  const visible = filter === "unread" ? sorted.filter((n) => n.status !== "read") : sorted;

  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        subtitle={
          unreadCount > 0
            ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
            : "ไม่มีการแจ้งเตือนใหม่"
        }
        actions={
          unreadCount > 0 ? <MarkAllReadButton /> : null
        }
      />

      <div className="pt-4 pb-8">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <FilterLink active={filter === "all"} href="/notifications">
            ทั้งหมด
          </FilterLink>
          <FilterLink active={filter === "unread"} href="/notifications?filter=unread">
            ยังไม่อ่าน {unreadCount > 0 ? `· ${unreadCount}` : ""}
          </FilterLink>
        </div>

        <Panel>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <BellOff className="size-6" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                {filter === "unread" ? "ไม่มีการแจ้งเตือนที่ยังไม่อ่าน" : "ยังไม่มีการแจ้งเตือน"}
              </p>
              <p className="text-xs text-muted-foreground">
                เมื่อมีงานใหม่หรือการเปลี่ยนแปลงจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {visible.map((notif) => (
                <NotificationRow key={notif.notifId} notif={notif} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function FilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

function NotificationRow({ notif }: { notif: Notification }): React.ReactElement {
  const isUnread = notif.status !== "read";
  const dotClass =
    ACTIVITY_EVENT_TONE[notif.event as ActivityEvent] as string | undefined ?? "bg-muted-foreground";
  const eventLabel =
    ACTIVITY_EVENT_TH[notif.event as ActivityEvent] as string | undefined ?? notif.event;

  return (
    <li className={cn("flex items-start gap-3 py-3.5", isUnread && "-mx-2 rounded-[10px] bg-secondary/50 px-2")}>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {eventLabel}
          </span>
          <span className="text-sm font-bold text-foreground">
            {notif.subject}
          </span>
          {notif.jobId ? (
            <Button
              render={<Link href={`/jobs/${notif.jobId}`} />}
              variant="link"
              size="sm"
              className="h-auto px-0 font-mono text-xs"
            >
              {notif.jobId}
            </Button>
          ) : null}
        </div>
        {notif.body ? (
          <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
            {notif.body}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {formatDateTime(notif.createdAt)}
          </span>
          {isUnread ? <MarkReadButton notifId={notif.notifId} /> : null}
        </div>
      </div>
    </li>
  );
}
