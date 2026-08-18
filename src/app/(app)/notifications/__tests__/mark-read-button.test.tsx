import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/notifications/actions", () => ({
  markAllNotificationsRead: vi.fn().mockResolvedValue({ ok: true }),
  markNotificationRead: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(app)/notifications/actions";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/app/(app)/notifications/mark-read-button";

beforeEach(() => {
  vi.mocked(markNotificationRead).mockClear();
  vi.mocked(markAllNotificationsRead).mockClear();
});

describe("MarkReadButton", () => {
  it("calls markNotificationRead with the notification id", async () => {
    const user = userEvent.setup();
    render(<MarkReadButton notifId="NOTIF-000001" />);
    await user.click(screen.getByRole("button", { name: "อ่านแล้ว" }));
    expect(markNotificationRead).toHaveBeenCalledWith("NOTIF-000001");
  });
});

describe("MarkAllReadButton", () => {
  it("calls markAllNotificationsRead with no args", async () => {
    const user = userEvent.setup();
    render(<MarkAllReadButton />);
    await user.click(screen.getByRole("button", { name: "อ่านทั้งหมด" }));
    expect(markAllNotificationsRead).toHaveBeenCalledWith();
  });
});
