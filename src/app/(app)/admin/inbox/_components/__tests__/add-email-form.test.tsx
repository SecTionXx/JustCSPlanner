import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/admin/inbox/actions", () => ({
  addEmail: vi.fn(),
}));

import { addEmail } from "@/app/(app)/admin/inbox/actions";
import { AddEmailForm } from "@/app/(app)/admin/inbox/_components/add-email-form";

const addEmailMock = vi.mocked(addEmail);

beforeEach(() => {
  addEmailMock.mockReset();
  addEmailMock.mockResolvedValue({ ok: true } as never);
});

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText(/จาก \(อีเมลผู้ส่ง\)/),
    "customer@company.co.th",
  );
  await user.type(screen.getByLabelText(/หัวเรื่อง/), "Re: Booking BK-12345");
  await user.type(screen.getByLabelText(/เนื้อความ/), "ส่ง SI แล้วครับ");
}

describe("AddEmailForm", () => {
  it("renders required fields with hints", () => {
    render(<AddEmailForm />);
    expect(screen.getByLabelText(/จาก \(อีเมลผู้ส่ง\)/)).toBeRequired();
    expect(screen.getByLabelText(/หัวเรื่อง/)).toBeRequired();
    expect(screen.getByText(/แนะนำงานที่ตรงกับเลข booking/)).toBeInTheDocument();
  });

  it("submits FormData to addEmail and resets on success", async () => {
    const user = userEvent.setup();
    render(<AddEmailForm />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "บันทึกเข้ากล่องรับ" }));

    await waitFor(() => expect(addEmailMock).toHaveBeenCalledTimes(1));
    const data = addEmailMock.mock.calls[0][0] as FormData;
    expect(data.get("fromAddress")).toBe("customer@company.co.th");
    expect(data.get("subject")).toBe("Re: Booking BK-12345");
    expect(data.get("body")).toBe("ส่ง SI แล้วครับ");

    await waitFor(() => {
      expect(screen.getByLabelText(/จาก \(อีเมลผู้ส่ง\)/)).toHaveValue("");
      expect(screen.getByLabelText(/หัวเรื่อง/)).toHaveValue("");
    });
  });

  it("surfaces the action error inline and keeps the text", async () => {
    const user = userEvent.setup();
    addEmailMock.mockRejectedValue(new Error("อีเมลซ้ำ") as never);
    render(<AddEmailForm />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "บันทึกเข้ากล่องรับ" }));
    await waitFor(() => expect(screen.getByText("อีเมลซ้ำ")).toBeInTheDocument());
    expect(screen.getByLabelText(/หัวเรื่อง/)).toHaveValue("Re: Booking BK-12345");
  });
});
