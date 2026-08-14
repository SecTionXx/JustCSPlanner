import type { ReactNode } from "react";

import { AppShell, type SidebarSection } from "@/components/shell";
import { canViewAdmin } from "@/lib/auth/permissions";
import { DEV_USERS, getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";

// Mock data uses `new Date()` for relative deadlines, so pages must render at
// request time — never statically cached.
export const dynamic = "force-dynamic";

const PRIMARY_NAV: SidebarSection[] = [
  {
    title: "ภาพรวม",
    items: [
      { icon: "anchor", label: "แดชบอร์ด", href: "/" },
      { icon: "clipboard", label: "งานของฉัน", href: "/jobs" },
      { icon: "triangle-alert", label: "งานเสี่ยง", href: "/risk" },
      { icon: "bell", label: "การแจ้งเตือน", href: "/notifications" },
      { icon: "sparkles", label: "ถาม AI", href: "/ai" },
    ],
  },
];

const TEAM_NAV: SidebarSection[] = [
  {
    title: "ทีม",
    items: [
      { icon: "users", label: "ทีม CS", href: "/team" },
      { icon: "git-branch", label: "จัดสรรงาน", href: "/assign" },
    ],
  },
];

// Admin/lead-only section. Appended only when canViewAdmin.
const ADMIN_NAV: SidebarSection[] = [
  {
    title: "แอดมิน",
    items: [
      { icon: "bar-chart", label: "รายงาน", href: "/reports" },
      { icon: "inbox", label: "กล่องอีเมล", href: "/admin/inbox" },
      { icon: "scan-search", label: "สแกนเตือน Deadline", href: "/admin/scan" },
      { icon: "user-cog", label: "จัดการทีม", href: "/admin/team" },
      { icon: "file-stack", label: "เทมเพลต", href: "/admin/templates" },
      { icon: "send", label: "สรุปประจำวัน", href: "/admin/summary" },
    ],
  },
];

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  const repo = getRepository();
  const [unread] = await Promise.all([
    repo.listNotifications(currentUser.csId, true),
  ]);
  const devUsers = Object.values(DEV_USERS);
  const isAdmin = canViewAdmin(currentUser);
  const nav = isAdmin
    ? [...PRIMARY_NAV, ...TEAM_NAV, ...ADMIN_NAV]
    : [...PRIMARY_NAV, ...TEAM_NAV];

  return (
    <AppShell
      currentCsId={currentUser.csId}
      devUsers={devUsers}
      nav={nav}
      contextLabel="ทีม CS · Freight Operations"
      unreadCount={unread.length}
    >
      {children}
    </AppShell>
  );
}
