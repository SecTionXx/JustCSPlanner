import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmCard } from "@/components/shell/confirm-card";

function setup() {
  const handlers = {
    onConfirm: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <ConfirmCard title="ร่างจาก AI" {...handlers}>
      <p>เนื้อหาร่าง</p>
    </ConfirmCard>,
  );
  return handlers;
}

describe("ConfirmCard", () => {
  it("renders the title and children", () => {
    setup();
    expect(screen.getByText("ร่างจาก AI")).toBeInTheDocument();
    expect(screen.getByText("เนื้อหาร่าง")).toBeInTheDocument();
  });

  it("renders default action labels", () => {
    setup();
    expect(screen.getByRole("button", { name: "ยืนยัน" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "แก้ไข" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toBeInTheDocument();
  });

  it("supports custom action labels", () => {
    render(
      <ConfirmCard
        title="t"
        confirmLabel="ใช้ร่างนี้"
        editLabel="ปรับ"
        cancelLabel="ทิ้ง"
      >
        body
      </ConfirmCard>,
    );
    expect(screen.getByRole("button", { name: "ใช้ร่างนี้" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปรับ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ทิ้ง" })).toBeInTheDocument();
  });

  it("fires confirm/edit/cancel handlers independently", async () => {
    const user = userEvent.setup();
    const handlers = setup();

    await user.click(screen.getByRole("button", { name: "ยืนยัน" }));
    expect(handlers.onConfirm).toHaveBeenCalledTimes(1);
    expect(handlers.onEdit).not.toHaveBeenCalled();
    expect(handlers.onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });
});
