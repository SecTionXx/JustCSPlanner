import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { resetNavigation, setNavigation } from "@/test/navigation";
import {
  Sidebar,
  SidebarDrawerContent,
  type SidebarSection,
} from "@/components/shell/sidebar";

const SECTIONS: SidebarSection[] = [
  {
    title: "ภาพรวม",
    items: [{ href: "/", label: "แดชบอร์ด", icon: "anchor" }],
  },
  {
    title: "งาน",
    items: [
      { href: "/jobs", label: "งานทั้งหมด", icon: "clipboard" },
      { href: "/assign", label: "มอบหมายงาน", icon: "users" },
    ],
  },
];

beforeEach(() => {
  resetNavigation();
});

describe("Sidebar", () => {
  it("renders expanded by default with section titles and labels", () => {
    render(<Sidebar sections={SECTIONS} />);
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
    expect(screen.getByText("งานทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("สร้าง Job Card")).toBeInTheDocument();
    expect(screen.getByText("Just Logistics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ย่อแถบเมนู" })).toBeInTheDocument();
  });

  it("marks the exact-matching nav item as current page", () => {
    setNavigation({ pathname: "/jobs" });
    render(<Sidebar sections={SECTIONS} />);
    expect(screen.getByRole("link", { name: "งานทั้งหมด" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "มอบหมายงาน" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("prefix-matches nested routes (/jobs/JOB-1 active under /jobs)", () => {
    setNavigation({ pathname: "/jobs/JOB-2026-0001" });
    render(<Sidebar sections={SECTIONS} />);
    expect(screen.getByRole("link", { name: "งานทั้งหมด" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("matches root only exactly (not every route)", () => {
    setNavigation({ pathname: "/jobs" });
    render(<Sidebar sections={SECTIONS} />);
    expect(screen.getByRole("link", { name: "แดชบอร์ด" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("collapses on toggle and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={SECTIONS} />);
    const aside = screen.getByRole("complementary");

    await user.click(screen.getByRole("button", { name: "ย่อแถบเมนู" }));
    expect(aside).toHaveAttribute("data-collapsed", "true");
    expect(window.localStorage.getItem("jcsp.sidebar.collapsed")).toBe("1");
    expect(screen.getByRole("button", { name: "ขยายแถบเมนู" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ขยายแถบเมนู" }));
    expect(aside).toHaveAttribute("data-collapsed", "false");
    expect(window.localStorage.getItem("jcsp.sidebar.collapsed")).toBe("0");
  });

  it("hides labels when collapsed", async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={SECTIONS} />);
    await user.click(screen.getByRole("button", { name: "ย่อแถบเมนู" }));
    expect(screen.queryByText("งานทั้งหมด")).toBeNull();
    expect(screen.queryByText("ภาพรวม")).toBeNull();
  });

  it("starts collapsed when localStorage says so", () => {
    window.localStorage.setItem("jcsp.sidebar.collapsed", "1");
    render(<Sidebar sections={SECTIONS} />);
    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("fires onNavigate when a nav link is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Sidebar sections={SECTIONS} onNavigate={onNavigate} />);
    await user.click(screen.getByRole("link", { name: "มอบหมายงาน" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("SidebarDrawerContent", () => {
  it("always renders expanded with active detection", () => {
    setNavigation({ pathname: "/assign" });
    render(<SidebarDrawerContent sections={SECTIONS} />);
    expect(screen.getByText("งานทั้งหมด")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "มอบหมายงาน" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
