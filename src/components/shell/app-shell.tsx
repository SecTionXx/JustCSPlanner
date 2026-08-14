"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { switchDevUser } from "@/app/(app)/actions"
import { Input } from "@/components/ui/input"
import { NotificationBell } from "@/components/shell/notification-bell"
import type { Role } from "@/lib/enums"
import { cn } from "@/lib/utils"

export interface NavItem {
  /** emoji / icon prefix */
  icon: string
  label: string
  href: string
}

export interface DevUserOption {
  csId: string
  displayName: string
  role: Role
}

export interface AppShellProps {
  children: React.ReactNode
  /** optional explicit current path override */
  currentPath?: string
  brand?: string
  tagline?: string
  /** right-hand context pill content */
  contextPill?: React.ReactNode
  nav?: NavItem[]
  searchPlaceholder?: string
  /** Dev role-switcher options. Omit to hide the switcher. */
  devUsers?: DevUserOption[]
  /** csId of the active dev user (selects the matching option). */
  currentCsId?: string
  /** Unread notification count for the bell badge (server-fetched). */
  unreadCount?: number
  className?: string
}

const DEFAULT_NAV: NavItem[] = [
  { icon: "🏠", label: "Dashboard", href: "/" },
  { icon: "📋", label: "งานของฉัน", href: "/jobs" },
  { icon: "📦", label: "Job Card", href: "/jobs/new" },
  { icon: "🚨", label: "งานเสี่ยง", href: "/risk" },
  { icon: "👥", label: "ทีม CS", href: "/team" },
]

/**
 * App chrome: top deep-purple bar with brand + global search + context pill,
 * followed by a tab-style nav. Active link is highlighted via usePathname.
 */
export function AppShell({
  children,
  currentPath,
  brand = "Just Logistics",
  tagline = "Freight Operations Planner",
  contextPill = "ทีม CS · วันนี้",
  nav = DEFAULT_NAV,
  searchPlaceholder = "⌕ ค้นหาชื่องาน, CS, Booking หรือ Shipment",
  devUsers,
  currentCsId,
  unreadCount,
  className,
}: AppShellProps): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const activePath = currentPath ?? pathname ?? ""
  const [query, setQuery] = React.useState("")

  const isActive = (href: string): boolean =>
    href === "/"
      ? activePath === "/"
      : activePath === href || activePath.startsWith(`${href}/`)

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/jobs?q=${encodeURIComponent(trimmed)}` : "/jobs")
  }

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {/* Top chrome bar */}
      <header
        className="flex h-16 items-center justify-between gap-4 px-6 text-white"
        style={{ backgroundColor: "#4f46a5" }}
      >
        <div className="flex min-w-0 items-center">
          <span className="whitespace-nowrap text-[18px] font-bold">
            {brand}
          </span>
          <span className="ml-2 hidden text-xs opacity-70 sm:inline">
            {tagline}
          </span>
        </div>
        <form
          onSubmit={handleSearch}
          role="search"
          className="hidden min-w-[250px] max-w-[480px] flex-1 md:block"
        >
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-0 bg-white text-xs text-[#707994] placeholder:text-[#9aa1b5]"
          />
        </form>
        <div className="flex items-center gap-2">
          <NotificationBell unreadCount={unreadCount} />
          {devUsers && devUsers.length > 0 ? (
            <DevRoleSwitcher users={devUsers} currentCsId={currentCsId} />
          ) : null}
          <div
            className="whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-[13px]"
            style={{ backgroundColor: "#625ab0" }}
          >
            {contextPill}
          </div>
        </div>
      </header>

      {/* Tab-style nav */}
      <nav
        className="flex gap-0.5 overflow-x-auto border-b bg-white px-3.5 py-2.5"
        style={{ borderBottomColor: "#ebe8fa" }}
        aria-label="Primary"
      >
        {nav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={`${item.icon}-${item.href}`}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "font-bold"
                  : "text-[#657085] hover:bg-[#f5f3fb] hover:text-foreground"
              )}
              style={
                active
                  ? { backgroundColor: "#eeeaff", color: "#5b21b6" }
                  : undefined
              }
            >
              <span aria-hidden className="mr-1">
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  )
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
  users: DevUserOption[]
  currentCsId?: string
}): React.ReactElement {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const csId = e.target.value
    if (!csId || csId === currentCsId) return
    startTransition(() => {
      void switchDevUser(csId).then(() => {
        router.refresh()
      })
    })
  }

  return (
    <label className="flex items-center gap-1 text-[11px] font-semibold opacity-90">
      <span className="hidden sm:inline">Dev: สลับบทบาท</span>
      <select
        value={currentCsId ?? ""}
        onChange={handleChange}
        disabled={pending}
        aria-label="สลับบทบาท (Dev)"
        className="h-8 rounded-md border-0 bg-white px-1.5 text-[11px] text-[#5b21b6] disabled:opacity-60"
      >
        {users.map((u) => (
          <option key={u.csId} value={u.csId}>
            {u.displayName} ({u.role})
          </option>
        ))}
      </select>
    </label>
  )
}
