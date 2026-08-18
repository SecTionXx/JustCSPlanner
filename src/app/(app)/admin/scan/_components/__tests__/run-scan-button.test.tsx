import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/admin/scan/actions", () => ({
  runScanNow: vi.fn(),
}));

import { runScanNow } from "@/app/(app)/admin/scan/actions";
import { RunScanButton } from "@/app/(app)/admin/scan/_components/run-scan-button";

const scanMock = vi.mocked(runScanNow);

beforeEach(() => {
  scanMock.mockReset();
});

describe("RunScanButton", () => {
  it("shows the sent/skipped counts after the scan", async () => {
    const user = userEvent.setup();
    scanMock.mockResolvedValue({ sent: 4, skipped: 7 } as never);
    render(<RunScanButton />);
    await user.click(screen.getByRole("button", { name: "รันสแกนตอนนี้" }));
    await waitFor(() =>
      expect(
        screen.getByText("ส่งแจ้งเตือน 4 รายการ · ข้าม 7 รายการ"),
      ).toBeInTheDocument(),
    );
  });

  it("keeps working after a thrown scan (no result line)", async () => {
    const user = userEvent.setup();
    scanMock.mockRejectedValue(new Error("forbidden") as never);
    render(<RunScanButton />);
    await user.click(screen.getByRole("button", { name: "รันสแกนตอนนี้" }));
    await waitFor(() => expect(scanMock).toHaveBeenCalled());
    expect(screen.queryByText(/ส่งแจ้งเตือน/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "รันสแกนตอนนี้" }),
    ).toBeEnabled();
  });
});
