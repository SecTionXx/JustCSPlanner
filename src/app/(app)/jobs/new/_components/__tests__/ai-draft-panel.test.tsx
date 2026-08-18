import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { JobDraft } from "@/lib/ai/schema";
import { AiDraftPanel } from "@/app/(app)/jobs/new/_components/ai-draft-panel";

vi.mock("@/app/(app)/jobs/new/actions", () => ({
  draftJobFromText: vi.fn(),
}));

import { draftJobFromText } from "@/app/(app)/jobs/new/actions";

const draftMock = vi.mocked(draftJobFromText);

const DRAFT: JobDraft = {
  customer: "บริษัท ทดสอบ",
  booking_number: "BK-777",
  origin: "Laem Chabang",
  destination: "Tokyo",
  deadline: "2026-09-01",
  shipment_type: "LCL",
  summary: "รายละเอียดสรุป",
  suggested_todos: ["จองพื้นที่", "ทำใบขน"],
  missing_information: ["carrier", "ETD"],
  confidence: "high",
};

beforeEach(() => {
  draftMock.mockReset();
});

function setup(initialText?: string) {
  const onApply = vi.fn();
  render(<AiDraftPanel initialText={initialText} onApply={onApply} />);
  return { onApply };
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /ร่างจากข้อความ/ }));
}

describe("AiDraftPanel", () => {
  it("starts closed without initial text and open with it", () => {
    const { } = setup();
    expect(screen.getByRole("button", { name: /ร่างจากข้อความ/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("starts expanded and prefilled when initialText is given", () => {
    setup("ข้อความ booking");
    expect(screen.getByRole("button", { name: /ร่างจากข้อความ/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("textbox")).toHaveValue("ข้อความ booking");
  });

  it("keeps ร่างงาน disabled until text is entered", async () => {
    const user = userEvent.setup();
    setup();
    await openPanel(user);
    const draftBtn = screen.getByRole("button", { name: "ร่างงาน" });
    expect(draftBtn).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "booking FCL BKK123");
    expect(draftBtn).toBeEnabled();
  });

  it("renders the draft fields, todos, and missing info on success", async () => {
    const user = userEvent.setup();
    setup();
    await openPanel(user);
    draftMock.mockResolvedValue({ enabled: true, draft: DRAFT });
    await user.type(screen.getByRole("textbox"), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ร่างงาน" }));

    await waitFor(() =>
      expect(screen.getByText("ร่างจาก AI — ตรวจสอบก่อนใช้")).toBeInTheDocument(),
    );
    expect(screen.getByText(/บริษัท ทดสอบ/)).toBeInTheDocument();
    expect(screen.getByText("Laem Chabang → Tokyo")).toBeInTheDocument();
    expect(screen.getByText("จองพื้นที่")).toBeInTheDocument();
    expect(screen.getByText("carrier")).toBeInTheDocument();
    expect(screen.getByText("ความมั่นใจ: สูง")).toBeInTheDocument();
  });

  it("shows the disabled error when AI is not enabled", async () => {
    const user = userEvent.setup();
    setup();
    await openPanel(user);
    draftMock.mockResolvedValue({ enabled: false });
    await user.type(screen.getByRole("textbox"), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ร่างงาน" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "ฟีเจอร์ AI ไม่ได้เปิดใช้งาน",
      ),
    );
  });

  it("shows a generic error when the draft fails", async () => {
    const user = userEvent.setup();
    setup();
    await openPanel(user);
    draftMock.mockResolvedValue({
      enabled: true,
      error: "โมเดลตอบผิด format",
    });
    await user.type(screen.getByRole("textbox"), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ร่างงาน" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("โมเดลตอบผิด format"),
    );
  });

  it("applies the draft via onApply and closes", async () => {
    const user = userEvent.setup();
    const { onApply } = setup();
    await openPanel(user);
    draftMock.mockResolvedValue({ enabled: true, draft: DRAFT });
    await user.type(screen.getByRole("textbox"), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ร่างงาน" }));
    await user.click(screen.getByRole("button", { name: "ใช้ร่างนี้" }));

    expect(onApply).toHaveBeenCalledWith(DRAFT);
    expect(
      screen.queryByText("ร่างจาก AI — ตรวจสอบก่อนใช้"),
    ).toBeNull();
  });

  it("แก้ไขเอง dismisses the draft without applying", async () => {
    const user = userEvent.setup();
    const { onApply } = setup();
    await openPanel(user);
    draftMock.mockResolvedValue({ enabled: true, draft: DRAFT });
    await user.type(screen.getByRole("textbox"), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ร่างงาน" }));
    await user.click(screen.getByRole("button", { name: "แก้ไขเอง" }));

    expect(onApply).not.toHaveBeenCalled();
    expect(
      screen.queryByText("ร่างจาก AI — ตรวจสอบก่อนใช้"),
    ).toBeNull();
    // Panel stays open with the text for editing.
    expect(screen.getByRole("textbox")).toHaveValue("ข้อความ");
  });
});
