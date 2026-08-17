import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/admin/summary/actions", () => ({
  sendTestSummary: vi.fn().mockResolvedValue({ ok: true }),
}));

import { sendTestSummary } from "@/app/(app)/admin/summary/actions";
import { SendTestSummaryButton } from "@/app/(app)/admin/summary/_components/send-test-summary-button";

beforeEach(() => {
  vi.mocked(sendTestSummary).mockClear();
});

describe("SendTestSummaryButton", () => {
  it("calls sendTestSummary on click", async () => {
    const user = userEvent.setup();
    render(<SendTestSummaryButton />);
    await user.click(screen.getByRole("button", { name: "ส่งสรุปทดสอบ" }));
    expect(sendTestSummary).toHaveBeenCalledTimes(1);
  });
});
