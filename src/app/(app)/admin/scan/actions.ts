"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canViewAdmin } from "@/lib/auth/permissions";
import { runScan } from "@/lib/notifications/scan";

/**
 * Manually trigger the deadline scan. Gated by canViewAdmin (lead/admin).
 * Returns sent/skipped counts and revalidates the scan + notifications pages.
 */
export async function runScanNow(): Promise<{
  sent: number;
  skipped: number;
}> {
  const user = await getCurrentUser();
  if (!canViewAdmin(user)) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการ (No permission)");
  }

  const result = await runScan();
  revalidatePath("/admin/scan");
  revalidatePath("/notifications");
  return { sent: result.sent.length, skipped: result.skipped };
}
