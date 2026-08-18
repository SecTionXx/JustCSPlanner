import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/admin/summary/actions", () => ({
  sendTestSummary: vi.fn(),
}));

import { sendTestSummary } from "@/app/(app)/admin/summary/actions";
import { SendSummaryButton } from "@/app/(app)/risk/_components/send-summary-button";

const sendMock = vi.mocked(sendTestSummary);

beforeEach(() => {
  sendMock.mockReset();
});

describe("SendSummaryButton", () => {
  it("shows ส่งสรุปแล้ว on success", async () => {
    const user = userEvent.setup();
    sendMock.mockResolvedValue({ ok: true } as never);
    render(<SendSummaryButton />);
    await user.click(screen.getByRole("button", { name: /ส่งสรุปให้ทีม/ }));
    await waitFor(() =>
      expect(screen.getByText("ส่งสรุปแล้ว")).toBeInTheDocument(),
    );
  });

  it("shows the server error message on failure", async () => {
    const user = userEvent.setup();
    sendMock.mockRejectedValue(new Error("ส่งอีเมลไม่สำเร็จ") as never);
    render(<SendSummaryButton />);
    await user.click(screen.getByRole("button", { name: /ส่งสรุปให้ทีม/ }));
    await waitFor(() =>
      expect(screen.getByText("ส่งอีเมลไม่สำเร็จ")).toBeInTheDocument(),
    );
    expect(screen.queryByText("ส่งสรุปแล้ว")).toBeNull();
  });
});
