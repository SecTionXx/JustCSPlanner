import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { NotificationBell } from "@/components/shell/notification-bell";

describe("NotificationBell", () => {
  it("links to /notifications without a badge when unread is 0", () => {
    render(<NotificationBell />);
    const link = screen.getByRole("link", { name: "การแจ้งเตือน" });
    expect(link).toHaveAttribute("href", "/notifications");
    expect(document.querySelector("span.bg-destructive")).toBeNull();
  });

  it("shows the exact count up to 9", () => {
    render(<NotificationBell unreadCount={3} />);
    expect(
      screen.getByRole("link", { name: "การแจ้งเตือน (3 ยังไม่อ่าน)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 9+ above nine unread", () => {
    render(<NotificationBell unreadCount={12} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "การแจ้งเตือน (12 ยังไม่อ่าน)" }),
    ).toBeInTheDocument();
  });
});
