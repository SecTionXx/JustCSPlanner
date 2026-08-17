import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CurrentUser } from "@/lib/types";
import { QaClient } from "@/app/(app)/ai/_components/qa-client";

vi.mock("@/app/(app)/ai/actions", () => ({
  askAi: vi.fn(),
}));

import { askAi } from "@/app/(app)/ai/actions";

const askAiMock = vi.mocked(askAi);

const USER: CurrentUser = {
  csId: "aom",
  displayName: "ออม สุชานาฏ",
  role: "cs_owner",
};

beforeEach(() => {
  askAiMock.mockReset();
});

function setup() {
  return render(<QaClient currentUser={USER} />);
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText("คำถามเกี่ยวกับงาน"), text);
  await user.click(screen.getByRole("button", { name: "ถาม" }));
}

describe("QaClient", () => {
  it("renders quick-prompt buttons that fill the question", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /งานใกล้ deadline/ }));
    expect(screen.getByLabelText("คำถามเกี่ยวกับงาน")).toHaveValue(
      "งานใกล้ deadline วันนี้มีอะไรบ้าง",
    );
  });

  it("keeps ถาม disabled for an empty question", () => {
    setup();
    expect(screen.getByRole("button", { name: "ถาม" })).toBeDisabled();
  });

  it("asks the trimmed question and renders the answer", async () => {
    const user = userEvent.setup();
    askAiMock.mockResolvedValue({
      enabled: true,
      answer: "มี 3 งานใกล้ deadline",
    });
    setup();
    await ask(user, "  งานใกล้ deadline?  ");
    expect(askAiMock).toHaveBeenCalledWith("งานใกล้ deadline?", USER);
    await waitFor(() =>
      expect(screen.getByText("มี 3 งานใกล้ deadline")).toBeInTheDocument(),
    );
  });

  it("shows the disabled message when AI is not configured", async () => {
    const user = userEvent.setup();
    askAiMock.mockResolvedValue({ enabled: false });
    setup();
    await ask(user, "อะไรดี");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "ฟีเจอร์ AI ปิดอยู่ — ตั้งค่า AI_API_KEY เพื่อเปิดใช้งาน",
      ),
    );
  });

  it("shows the server error when the answer fails", async () => {
    const user = userEvent.setup();
    askAiMock.mockResolvedValue({ enabled: true, error: "ไม่พบข้อมูล" });
    setup();
    await ask(user, "อะไรดี");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("ไม่พบข้อมูล"),
    );
  });

  it("shows a generic error when the action throws", async () => {
    const user = userEvent.setup();
    askAiMock.mockRejectedValue(new Error("boom"));
    setup();
    await ask(user, "อะไรดี");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "เรียกบริการ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      ),
    );
  });

  it("Cmd+Enter submits the question", async () => {
    const user = userEvent.setup();
    askAiMock.mockResolvedValue({ enabled: true, answer: "ตอบ" });
    setup();
    await user.type(screen.getByLabelText("คำถามเกี่ยวกับงาน"), "ทดสอบ");
    await user.keyboard("{Meta>}{Enter}{/Meta}");
    await waitFor(() =>
      expect(askAiMock).toHaveBeenCalledWith("ทดสอบ", USER),
    );
  });
});
