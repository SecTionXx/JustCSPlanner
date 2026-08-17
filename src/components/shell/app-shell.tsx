"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sidebar, SidebarDrawerContent, type SidebarSection } from "@/components/shell/sidebar";
import { TopBar, type DevUserOption } from "@/components/shell/top-bar";

export { type SidebarSection };
export type NavItem = SidebarSection["items"][number];

export interface AppShellProps {
  children: React.ReactNode;
  /** Nav sections rendered in the sidebar. */
  nav: SidebarSection[];
  /** Right-hand page-context label in the top bar. */
  contextLabel?: React.ReactNode;
  brand?: string;
  tagline?: string;
  searchPlaceholder?: string;
  /** Dev role-switcher options. Omit to hide the switcher. */
  devUsers?: DevUserOption[];
  /** csId of the active dev user (selects the matching option). */
  currentCsId?: string;
  /** Unread notification count for the bell badge (server-fetched). */
  unreadCount?: number;
  className?: string;
}

const DEFAULT_NAV: SidebarSection[] = [
  {
    title: "ภาพรวม",
    items: [
      { href: "/", label: "แดชบอร์ด", icon: "anchor" },
    ],
  },
];

/**
 * App chrome: dark harbor sidebar (desktop) / drawer (mobile) + sticky top bar
 * with global search, notifications, theme toggle and the dev role switcher.
 */
export function AppShell({
  children,
  nav = DEFAULT_NAV,
  contextLabel,
  brand,
  tagline,
  searchPlaceholder,
  devUsers,
  currentCsId,
  unreadCount,
}: AppShellProps): React.ReactElement {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const shared = {
    sections: nav,
    brand,
    tagline,
    primaryIcon: "file-plus" as const,
    onNavigate: () => setDrawerOpen(false),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar {...shared} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          contextLabel={contextLabel}
          searchPlaceholder={searchPlaceholder}
          onOpenNav={() => setDrawerOpen(true)}
          devUsers={devUsers}
          currentCsId={currentCsId}
          unreadCount={unreadCount}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>

      {/* Mobile nav drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 h-full max-h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none rounded-r-xl p-0 data-closed:slide-out-to-left data-open:slide-in-from-left"
        >
          <SidebarDrawerContent {...shared} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
