"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { switchDevUser } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import type { Role } from "@/lib/enums";

export interface DevUserOption {
  csId: string;
  displayName: string;
  role: Role;
}

export interface TopBarProps {
  /** Page context label (from current nav section). */
  contextLabel?: React.ReactNode;
  searchPlaceholder?: string;
  /** Opens the mobile nav drawer. */
  onOpenNav?: () => void;
  /** Dev role-switcher options. Omit to hide the switcher. */
  devUsers?: DevUserOption[];
  /** csId of the active dev user (selects the matching option). */
  currentCsId?: string;
  /** Unread notification count for the bell badge (server-fetched). */
  unreadCount?: number;
}

/**
 * Sticky app header: mobile hamburger + page context, global search,
 * notification bell, theme toggle, dev role switcher.
 */
export function TopBar({
  contextLabel,
  searchPlaceholder = "ค้นหาชื่องาน, CS, Booking หรือ Shipment",
  onOpenNav,
  devUsers,
  currentCsId,
  unreadCount,
}: TopBarProps): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/jobs?q=${encodeURIComponent(trimmed)}` : "/jobs");
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 lg:px-6">
      {onOpenNav ? (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="เปิดเมนู"
          onClick={onOpenNav}
        >
          <Menu className="size-5" />
        </Button>
      ) : null}

      {contextLabel ? (
        <span className="hidden min-w-0 truncate text-sm font-semibold text-muted-foreground sm:block">
          {contextLabel}
        </span>
      ) : null}

      <form
        onSubmit={handleSearch}
        role="search"
        className="ml-auto hidden min-w-[220px] max-w-[420px] flex-1 md:block"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        {/* Mobile search shortcut */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="ค้นหา"
          onClick={() => router.push("/jobs")}
        >
          <Search className="size-4" />
        </Button>

        <NotificationBell unreadCount={unreadCount} />
        <ThemeToggle />

        {devUsers && devUsers.length > 0 ? (
          <DevRoleSwitcher users={devUsers} currentCsId={currentCsId} />
        ) : null}
      </div>
    </header>
  );
}

/**
 * Dev-only role switcher. Posts the chosen csId to the `switchDevUser` server
 * action (sets a cookie) then refreshes so getCurrentUser resolves to the new
 * user. Mock-auth only — safe to keep visible until real auth lands.
 */
function DevRoleSwitcher({
  users,
  currentCsId,
}: {
  users: DevUserOption[];
  currentCsId?: string;
}): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const csId = e.target.value;
    if (!csId || csId === currentCsId) return;
    startTransition(() => {
      void switchDevUser(csId).then(() => {
        router.refresh();
      });
    });
  }

  return (
    <label className="ml-1 hidden items-center gap-1.5 text-[11px] font-semibold text-muted-foreground sm:flex">
      <span>Dev:</span>
      <select
        value={currentCsId ?? ""}
        onChange={handleChange}
        disabled={pending}
        aria-label="สลับบทบาท (Dev)"
        className="h-8 rounded-md border border-input bg-card px-1.5 text-[11px] font-medium text-foreground disabled:opacity-60"
      >
        {users.map((u) => (
          <option key={u.csId} value={u.csId}>
            {u.displayName} ({u.role})
          </option>
        ))}
      </select>
    </label>
  );
}
