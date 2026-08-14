"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canViewAdmin } from "@/lib/auth/permissions";
import { getRepository } from "@/lib/repository";
import { buildDailySummary, summaryToText } from "@/lib/notifications/summary";

/**
 * Build the daily summary and notify the current user (in-app) with subject
 * "สรุปประจำวัน (ทดสอบ)". Lets a lead/admin verify the summary lands in their
 * notifications bell before wiring up the cron schedule.
 *
 * Writes directly to appendNotification() (bypassing notify()) because the
 * summary needs a custom subject/body that notify()'s auto-template cannot
 * produce. Lead/admin only (canViewAdmin).
 */
export async function sendTestSummary(): Promise<void> {
  const user = await getCurrentUser();
  if (!canViewAdmin(user)) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการ (No permission)");
  }

  const summary = await buildDailySummary();
  const body = summaryToText(summary);

  const repo = getRepository();
  await repo.appendNotification({
    recipientCsId: user.csId,
    event: "note_added",
    channel: "in-app",
    subject: "สรุปประจำวัน (ทดสอบ)",
    body,
    status: "sent",
  });

  revalidatePath("/admin/summary");
  revalidatePath("/notifications");
}
