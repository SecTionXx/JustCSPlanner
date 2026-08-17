"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  BarChart3,
  Bell,
  ClipboardList,
  FileStack,
  FilePlus2,
  GitBranch,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Send,
  Ship,
  Sparkles,
  TriangleAlert,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Serializable icon reference — server layouts pass a string key because
 * component references cannot cross the RSC → client boundary.
 */
export type SidebarIconName =
  | "anchor"
  | "bar-chart"
  | "bell"
  | "clipboard"
  | "file-stack"
  | "git-branch"
  | "inbox"
  | "scan-search"
  | "send"
  | "sparkles"
  | "triangle-alert"
  | "user-cog"
  | "users";

const ICONS: Record<SidebarIconName, LucideIcon> = {
  anchor: Anchor,
  "bar-chart": BarChart3,
  bell: Bell,
  clipboard: ClipboardList,
  "file-stack": FileStack,
  "git-branch": GitBranch,
  inbox: Inbox,
  "scan-search": ScanSearch,
  send: Send,
  sparkles: Sparkles,
  "triangle-alert": TriangleAlert,
  "user-cog": UserCog,
  users: Users,
};

export interface SidebarNavItem {
  icon: SidebarIconName;
  label: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

const PRIMARY_ICONS = { anchor: Anchor, "file-plus": FilePlus2 } as const;

export interface SidebarProps {
  sections: SidebarSection[];
  /** Primary "สร้างงาน" entry rendered above the sections. */
  primaryHref?: string;
  primaryLabel?: string;
  primaryIcon?: "anchor" | "file-plus";
  brand?: string;
  tagline?: string;
  /** Opens the mobile drawer (parent owns the open state). */
  onNavigate?: () => void;
}

const STORAGE_KEY = "jcsp.sidebar.collapsed";

const emptySubscribe = () => () => {};
const readCollapsed = () => window.localStorage.getItem(STORAGE_KEY) === "1";

/**
 * Desktop sidebar: dark harbor panel, collapsible w-60 ↔ w-14 with tooltips.
 * On mobile the parent renders the same nav inside a drawer.
 */
export function Sidebar({
  sections,
  primaryHref = "/jobs/new",
  primaryLabel = "สร้าง Job Card",
  primaryIcon = "anchor",
  brand = "Just Logistics",
  tagline = "Freight Ops Planner",
  onNavigate,
}: SidebarProps): React.ReactElement {
  const PrimaryIcon = PRIMARY_ICONS[primaryIcon];
  const pathname = usePathname();
  // Persisted collapse state read post-hydration (SSR always renders expanded).
  const storedCollapsed = React.useSyncExternalStore(
    emptySubscribe,
    readCollapsed,
    () => false
  );
  const [override, setOverride] = React.useState<boolean | null>(null);
  const collapsed = override ?? storedCollapsed;

  function toggleCollapsed(): void {
    const next = !collapsed;
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    setOverride(next);
  }

  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Ship className="size-4" />
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{brand}</span>
            <span className="block truncate text-[11px] text-sidebar-foreground/70">
              {tagline}
            </span>
          </span>
        ) : null}
      </div>

      {/* Primary CTA */}
      <div className="px-2 pt-3">
        <Link
          href={primaryHref}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-sidebar-primary px-2.5 py-2 text-[13px] font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90",
            collapsed && "justify-center px-0"
          )}
        >
          <PrimaryIcon className="size-4 shrink-0" />
          {!collapsed ? primaryLabel : null}
        </Link>
      </div>

      {/* Sections */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-3 last:mb-0">
            {!collapsed ? (
              <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {(() => {
                      const Icon = ICONS[item.icon];
                      return <Icon className="size-4 shrink-0" />;
                    })()}
                    {!collapsed ? item.label : null}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger render={link} />
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" />
              ย่อแถบเมนู
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/**
 * Mobile drawer content — same nav, always expanded, light surface.
 * Rendered inside a Dialog by the shell.
 */
export function SidebarDrawerContent({
  sections,
  primaryHref = "/jobs/new",
  primaryLabel = "สร้าง Job Card",
  primaryIcon = "anchor",
  brand = "Just Logistics",
  tagline = "Freight Ops Planner",
  onNavigate,
}: SidebarProps): React.ReactElement {
  const PrimaryIcon = PRIMARY_ICONS[primaryIcon];
  const pathname = usePathname();
  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Ship className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-foreground">{brand}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{tagline}</span>
        </span>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-3">
        <div className="px-3 pb-2">
          <Link
            href={primaryHref}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg bg-primary px-2.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PrimaryIcon className="size-4 shrink-0" />
            {primaryLabel}
          </Link>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-3 px-3 last:mb-0">
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-secondary font-semibold text-secondary-foreground"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {(() => {
                      const Icon = ICONS[item.icon];
                      return <Icon className="size-4 shrink-0" />;
                    })()}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
