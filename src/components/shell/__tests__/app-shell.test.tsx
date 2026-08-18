import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import "@/test/theme";
import { resetNavigation } from "@/test/navigation";
import { AppShell, type SidebarSection } from "@/components/shell/app-shell";

vi.mock("@/app/(app)/actions", () => ({
  switchDevUser: vi.fn().mockResolvedValue({ ok: true }),
}));

const NAV: SidebarSection[] = [
  {
    title: "ภาพรวม",
    items: [{ href: "/", label: "แดชบอร์ด", icon: "anchor" }],
  },
  {
    title: "งาน",
    items: [{ href: "/jobs", label: "งานทั้งหมด", icon: "clipboard" }],
  },
];

beforeEach(() => {
  resetNavigation();
});

describe("AppShell", () => {
  it("renders sidebar nav, top bar, and main children", () => {
    render(
      <AppShell nav={NAV} contextLabel="ทดสอบ">
        <p>เนื้อหาหน้า</p>
      </AppShell>,
    );
    expect(screen.getByText("งานทั้งหมด")).toBeInTheDocument(); // sidebar
    expect(screen.getByText("ทดสอบ")).toBeInTheDocument(); // top bar context
    expect(screen.getByRole("main")).toHaveTextContent("เนื้อหาหน้า");
  });

  it("uses the default nav when nav is omitted at runtime", () => {
    // nav has a default but the prop is typed required — cast to bypass.
    render(<AppShell nav={undefined as unknown as SidebarSection[]}>เนื้อหา</AppShell>);
    expect(screen.getByText("แดชบอร์ด")).toBeInTheDocument();
  });

  it("opens the mobile drawer via the hamburger and closes on nav", async () => {
    const user = userEvent.setup();
    render(
      <AppShell nav={NAV}>
        <p>x</p>
      </AppShell>,
    );

    // Drawer content lives in a portal — query on document.body via screen.
    await user.click(screen.getByRole("button", { name: "เปิดเมนู" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("แดชบอร์ด");

    // Clicking a drawer nav link closes it (onNavigate → setDrawerOpen(false)).
    const drawerLink = within(dialog).getByRole("link", { name: "แดชบอร์ด" });
    await user.click(drawerLink);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
