import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import "@/test/theme";
import { navState, resetNavigation } from "@/test/navigation";
import { TopBar } from "@/components/shell/top-bar";

vi.mock("@/app/(app)/actions", () => ({
  switchDevUser: vi.fn().mockResolvedValue({ ok: true }),
}));

beforeEach(() => {
  resetNavigation();
});

describe("TopBar", () => {
  it("renders the page context label and search box", () => {
    render(<TopBar contextLabel="งานทั้งหมด" />);
    expect(screen.getByText("งานทั้งหมด")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "ค้นหาชื่องาน, CS, Booking หรือ Shipment",
      ),
    ).toBeInTheDocument();
  });

  it("hides the hamburger when onOpenNav is omitted", () => {
    render(<TopBar />);
    expect(screen.queryByRole("button", { name: "เปิดเมนู" })).toBeNull();
  });

  it("fires onOpenNav from the hamburger button", async () => {
    const user = userEvent.setup();
    const onOpenNav = vi.fn();
    render(<TopBar onOpenNav={onOpenNav} />);
    await user.click(screen.getByRole("button", { name: "เปิดเมนู" }));
    expect(onOpenNav).toHaveBeenCalledTimes(1);
  });

  it("search submit pushes /jobs?q= with the encoded query", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.type(
      screen.getByPlaceholderText(/ค้นหาชื่องาน/),
      "BK-001 ทดสอบ",
    );
    await user.keyboard("{Enter}");
    expect(navState.push).toHaveBeenCalledWith(
      `/jobs?q=${encodeURIComponent("BK-001 ทดสอบ")}`,
    );
  });

  it("empty and whitespace queries push plain /jobs", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.type(screen.getByPlaceholderText(/ค้นหาชื่องาน/), "   ");
    await user.keyboard("{Enter}");
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });

  it("mobile search shortcut pushes /jobs", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: "ค้นหา" }));
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });

  it("passes unreadCount to the bell", () => {
    render(<TopBar unreadCount={4} />);
    expect(
      screen.getByRole("link", { name: "การแจ้งเตือน (4 ยังไม่อ่าน)" }),
    ).toBeInTheDocument();
  });
});

describe("DevRoleSwitcher", () => {
  const users = [
    { csId: "jantana", displayName: "จันทนา", role: "lead" as const },
    { csId: "aom", displayName: "ออม", role: "cs_owner" as const },
  ];

  it("hides the switcher when devUsers is omitted", () => {
    render(<TopBar />);
    expect(screen.queryByLabelText("สลับบทบาท (Dev)")).toBeNull();
  });

  it("renders the current dev user as selected", () => {
    render(<TopBar devUsers={users} currentCsId="aom" />);
    const select = screen.getByLabelText("สลับบทบาท (Dev)") as HTMLSelectElement;
    expect(select.value).toBe("aom");
  });

  it("switching user calls switchDevUser then router.refresh", async () => {
    const user = userEvent.setup();
    const { switchDevUser } = await import("@/app/(app)/actions");
    render(<TopBar devUsers={users} currentCsId="aom" />);
    await user.selectOptions(
      screen.getByLabelText("สลับบทบาท (Dev)"),
      "jantana",
    );
    await waitFor(() => {
      expect(switchDevUser).toHaveBeenCalledWith("jantana");
      expect(navState.refresh).toHaveBeenCalled();
    });
  });

  it("re-selecting the current user is a no-op", async () => {
    const user = userEvent.setup();
    const { switchDevUser } = await import("@/app/(app)/actions");
    vi.mocked(switchDevUser).mockClear();
    render(<TopBar devUsers={users} currentCsId="aom" />);
    await user.selectOptions(
      screen.getByLabelText("สลับบทบาท (Dev)"),
      "aom",
    );
    expect(switchDevUser).not.toHaveBeenCalled();
  });
});
