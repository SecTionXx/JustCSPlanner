"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";

/**
 * Mark a single notification as read (status → "read", stamps readAt). The
 * notifications list is user-scoped; the UI only surfaces the current user's
 * rows, so ownership is implied by the rendered list.
 */
export async function markNotificationRead(notifId: string): Promise<void> {
  const trimmed = notifId.trim();
  if (!trimmed) throw new Error("กรุณาระบุรหัสการแจ้งเตือน");

  await getCurrentUser();
  const repo = getRepository();
  await repo.markNotificationRead(trimmed);
  revalidatePath("/notifications");
}

/**
 * Mark every unread notification for the current user as read. Used by the
 * "อ่านทั้งหมด" button on the notifications page.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const unread = await repo.listNotifications(user.csId, true);
  await Promise.all(unread.map((n) => repo.markNotificationRead(n.notifId)));
  revalidatePath("/notifications");
}
