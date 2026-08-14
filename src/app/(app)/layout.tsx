import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/shell";
import { canViewAdmin } from "@/lib/auth/permissions";
import { DEV_USERS, getCurrentUser } from "@/lib/auth/current-user";

// Mock data uses `new Date()` for relative deadlines, so pages must render at
// request time — never statically cached.
export const dynamic = "force-dynamic";

const PRIMARY_NAV: NavItem[] = [
  { icon: "🏠", label: "Dashboard", href: "/" },
  { icon: "📋", label: "งานของฉัน", href: "/jobs" },
  { icon: "📦", label: "Job Card", href: "/jobs/new" },
  { icon: "🚨", label: "งานเสี่ยง", href: "/risk" },
  { icon: "👥", label: "ทีม CS", href: "/team" },
];

// Admin/lead-only nav. Appended to PRIMARY_NAV only when canViewAdmin.
const ADMIN_NAV: NavItem[] = [
  { icon: "🗂️", label: "จัดสรรงาน", href: "/assign" },
  { icon: "👤", label: "จัดการทีม", href: "/admin/team" },
  { icon: "📝", label: "เทมเพลต", href: "/admin/templates" },
];

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  const devUsers = Object.values(DEV_USERS);
  const nav = canViewAdmin(currentUser)
    ? [...PRIMARY_NAV, ...ADMIN_NAV]
    : PRIMARY_NAV;

  return (
    <AppShell currentCsId={currentUser.csId} devUsers={devUsers} nav={nav}>
      {children}
    </AppShell>
  );
}
