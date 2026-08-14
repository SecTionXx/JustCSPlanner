import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

import { PageHeader, Panel } from "../_components/field";
import { MarkAllReadButton, MarkReadButton } from "./mark-read-button";

export const dynamic = "force-dynamic";

const EVENT_BADGE_TONE: Record<string, string> = {
  job_created: "#177a55",
  job_closed: "#1d6fa5",
  status_changed: "#7050d6",
  owner_changed: "#d27b1c",
  deadline_changed: "#d27b1c",
  todo_added: "#7050d6",
  todo_completed: "#177a55",
  note_added: "#657085",
  doc_added: "#1d6fa5",
};

export default async function NotificationsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const notifications = await repo.listNotifications(user.csId);

  // Newest first.
  const sorted = [...notifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const unreadCount = sorted.filter((n) => n.status !== "read").length;

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

      <div className="px-6 pt-4 pb-8">
        <Panel>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <span aria-hidden className="text-3xl">🔔</span>
              <p className="text-sm font-semibold text-foreground">
                ยังไม่มีการแจ้งเตือน
              </p>
              <p className="text-xs text-muted-foreground">
                เมื่อมีงานใหม่หรือการเปลี่ยนแปลงจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
              {sorted.map((notif) => (
                <NotificationRow key={notif.notifId} notif={notif} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function NotificationRow({ notif }: { notif: Notification }): React.ReactElement {
  const isUnread = notif.status !== "read";
  const tone = EVENT_BADGE_TONE[notif.event] ?? "#657085";

  return (
    <li className="flex items-start gap-3 py-3.5">
      <span
        className="mt-1 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: isUnread ? tone : "transparent",
          outline: isUnread ? "none" : `1px solid ${tone}`,
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: `${tone}1a`, color: tone }}
          >
            {notif.event}
          </span>
          <span className="text-sm font-bold text-foreground">
            {notif.subject}
          </span>
          {notif.jobId ? (
            <Button
              render={<Link href={`/jobs/${notif.jobId}`} />}
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs"
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
