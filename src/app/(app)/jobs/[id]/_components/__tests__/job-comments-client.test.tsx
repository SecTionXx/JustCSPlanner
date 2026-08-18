import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { resetNavigation } from "@/test/navigation";

vi.mock("@/app/(app)/actions", () => ({
  addComment: vi.fn().mockResolvedValue(undefined),
}));

import { addComment } from "@/app/(app)/actions";
import { JobCommentsClient } from "@/app/(app)/jobs/[id]/_components/job-comments-client";

const addCommentMock = vi.mocked(addComment);

const COMMENTS = [
  { id: "c1", author: "ออม", time: "17 ส.ค. 09:00", body: "ติดตามลูกค้าแล้ว" },
];

beforeEach(() => {
  resetNavigation();
  addCommentMock.mockClear();
  addCommentMock.mockResolvedValue(undefined);
});

function setup() {
  return render(<JobCommentsClient jobId="JOB-2026-0001" comments={COMMENTS} />);
}

describe("JobCommentsClient", () => {
  it("renders the thread with an add button", () => {
    setup();
    expect(screen.getByText("ติดตามลูกค้าแล้ว")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }),
    ).toBeInTheDocument();
  });

  it("opens the composer on add click", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    expect(screen.getByPlaceholderText("พิมพ์คอมเมนต์...")).toBeInTheDocument();
  });

  it("send stays disabled for empty text", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    expect(screen.getByRole("button", { name: "ส่งคอมเมนต์" })).toBeDisabled();
  });

  it("submits the trimmed comment and closes the composer on success", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    await user.type(screen.getByPlaceholderText("พิมพ์คอมเมนต์..."), "  รับทราบ  ");
    await user.click(screen.getByRole("button", { name: "ส่งคอมเมนต์" }));

    await waitFor(() =>
      expect(addCommentMock).toHaveBeenCalledWith("JOB-2026-0001", "รับทราบ"),
    );
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("พิมพ์คอมเมนต์..."),
      ).toBeNull(),
    );
  });

  it("keeps the composer open with the text when submission fails", async () => {
    const user = userEvent.setup();
    addCommentMock.mockRejectedValue(new Error("boom") as never);
    setup();
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    const textarea = screen.getByPlaceholderText("พิมพ์คอมเมนต์...");
    await user.type(textarea, "คอมเมนต์ที่ส่งไม่สำเร็จ");
    await user.click(screen.getByRole("button", { name: "ส่งคอมเมนต์" }));

    await waitFor(() => expect(addCommentMock).toHaveBeenCalled());
    expect(textarea).toHaveValue("คอมเมนต์ที่ส่งไม่สำเร็จ");
  });

  it("cancel closes the composer and clears the text", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    await user.type(screen.getByPlaceholderText("พิมพ์คอมเมนต์..."), "ข้อความ");
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(screen.queryByPlaceholderText("พิมพ์คอมเมนต์...")).toBeNull();
    expect(addCommentMock).not.toHaveBeenCalled();
  });
});
