import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { resetNavigation } from "@/test/navigation";
import { buildTeamMember, buildTodo } from "@/test/fixtures";

vi.mock("@/app/(app)/actions", () => ({
  addTodo: vi.fn().mockResolvedValue({ ok: true }),
  deleteTodoAction: vi.fn().mockResolvedValue({ ok: true }),
  toggleTodo: vi.fn().mockResolvedValue({ ok: true }),
  updateJobStatus: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  addTodo,
  deleteTodoAction,
  toggleTodo,
  updateJobStatus,
} from "@/app/(app)/actions";
import { JobDetailClient } from "@/app/(app)/jobs/[id]/_components/job-detail-client";

const TEAM = [
  buildTeamMember({ csId: "aom", displayName: "ออม สุชานาฏ" }),
  buildTeamMember({ csId: "may", displayName: "เมย" }),
];

const TODOS = [
  buildTodo({ todoId: "TODO-00002", title: "ทำสอง", createdAt: "2026-08-16T10:00:00.000+07:00" }),
  buildTodo({ todoId: "TODO-00001", title: "ทำหนึ่ง", createdAt: "2026-08-15T09:00:00.000+07:00" }),
  buildTodo({
    todoId: "TODO-00003",
    title: "เสร็จแล้ว",
    status: "Done",
    createdAt: "2026-08-14T08:00:00.000+07:00",
  }),
];

beforeEach(() => {
  resetNavigation();
  for (const fn of [addTodo, deleteTodoAction, toggleTodo, updateJobStatus]) {
    vi.mocked(fn).mockClear();
  }
});

function setup(overrides = {}) {
  return render(
    <JobDetailClient
      jobId="JOB-2026-0001"
      status="In Progress"
      todos={TODOS}
      ownerName="ออม สุชานาฏ"
      team={TEAM}
      canManage
      {...overrides}
    />,
  );
}

describe("JobDetailClient", () => {
  it("sorts todos by creation time (oldest first)", () => {
    setup();
    const first = screen.getByText("เสร็จแล้ว"); // 14th
    const second = screen.getByText("ทำหนึ่ง"); // 15th
    const third = screen.getByText("ทำสอง"); // 16th
    const follows = (a: HTMLElement, b: HTMLElement) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(first, second)).toBe(true);
    expect(follows(second, third)).toBe(true);
  });

  it("hides all mutation UI when canManage is false", () => {
    setup({ canManage: false });
    expect(screen.queryByRole("button", { name: "ปิดงาน" })).toBeNull();
    expect(screen.queryByRole("button", { name: "ลบ To-do" })).toBeNull();
    expect(screen.queryByPlaceholderText("+ เพิ่ม To-do...")).toBeNull();
    expect(screen.getByText("เจ้าของงาน:")).toBeInTheDocument();
  });

  it("omits the current status from action buttons", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: "รับงาน" }),
    ).toBeNull(); // both In Progress actions share the current status
    expect(screen.getByRole("button", { name: "ปิดงาน" })).toBeInTheDocument();
  });

  it("plain status button calls updateJobStatus directly", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "รอลูกค้า" }));
    expect(updateJobStatus).toHaveBeenCalledWith(
      "JOB-2026-0001",
      "Waiting Customer",
    );
  });

  it("closing the job requires an explicit confirm dialog first", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "ปิดงาน" }));
    const dialog = screen.getByRole("dialog", { name: "ยืนยันการปิดงาน" });
    expect(updateJobStatus).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByPlaceholderText("หมายเหตุ (ไม่บังคับ)"),
      "งานเสร็จเรียบร้อย",
    );
    await user.click(within(dialog).getByRole("button", { name: "ยืนยันปิดงาน" }));
    expect(updateJobStatus).toHaveBeenCalledWith(
      "JOB-2026-0001",
      "Completed",
      "งานเสร็จเรียบร้อย",
    );
  });

  it("toggling a todo flips its done state via toggleTodo", async () => {
    const user = userEvent.setup();
    setup();
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(toggleTodo).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Boolean),
      "JOB-2026-0001",
    );
  });
});

describe("AddTodoComposer", () => {
  it("add stays disabled until a title is given and calls addTodo", async () => {
    const user = userEvent.setup();
    setup();
    const addBtn = screen.getByRole("button", { name: "เพิ่ม" });
    expect(addBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText("+ เพิ่ม To-do..."), "ส่งใบแจ้งหนี้");
    await user.selectOptions(screen.getByLabelText("มอบหมายให้"), "may");
    await user.click(addBtn);

    await waitFor(() =>
      expect(addTodo).toHaveBeenCalledWith("JOB-2026-0001", "ส่งใบแจ้งหนี้", "may"),
    );
  });

  it("Enter key also submits and clears the input on success", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByPlaceholderText("+ เพิ่ม To-do...");
    await user.type(input, "ตรวจสอบตู้");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(addTodo).toHaveBeenCalledWith("JOB-2026-0001", "ตรวจสอบตู้", "aom"),
    );
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps the title when addTodo fails so the user can retry", async () => {
    const user = userEvent.setup();
    vi.mocked(addTodo).mockRejectedValue(new Error("fail") as never);
    setup();
    const input = screen.getByPlaceholderText("+ เพิ่ม To-do...");
    await user.type(input, "งานที่ล้มเหลว");
    await user.click(screen.getByRole("button", { name: "เพิ่ม" }));
    await waitFor(() => expect(addTodo).toHaveBeenCalled());
    expect(input).toHaveValue("งานที่ล้มเหลว");
  });
});

describe("TodoDeleteButton", () => {
  it("deletes via confirm dialog", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "ลบ To-do" })[0]);
    const dialog = screen.getByRole("dialog", { name: "ลบ To-do" });
    await user.click(within(dialog).getByRole("button", { name: "ลบ" }));
    await waitFor(() => expect(deleteTodoAction).toHaveBeenCalled());
  });
});
