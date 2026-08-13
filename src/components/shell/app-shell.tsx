"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface NavItem {
  /** emoji / icon prefix */
  icon: string
  label: string
  href: string
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
  className,
}: AppShellProps): React.ReactElement {
  const pathname = usePathname()
  const activePath = currentPath ?? pathname ?? ""

  const isActive = (href: string): boolean =>
    href === "/"
      ? activePath === "/"
      : activePath === href || activePath.startsWith(`${href}/`)

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
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="hidden h-9 min-w-[250px] max-w-[480px] flex-1 border-0 bg-white text-xs text-[#707994] placeholder:text-[#9aa1b5] md:inline-flex"
        />
        <div
          className="whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-[13px]"
          style={{ backgroundColor: "#625ab0" }}
        >
          {contextPill}
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
