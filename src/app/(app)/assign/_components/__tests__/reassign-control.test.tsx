import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation } from "@/test/navigation";
import { ReassignControl } from "@/app/(app)/assign/_components/reassign-control";
import { buildTeamMember } from "@/test/fixtures";

vi.mock("@/app/(app)/actions", () => ({
  editJob: vi.fn().mockResolvedValue({ ok: true }),
}));

const TEAM = [
  buildTeamMember({ csId: "aom", displayName: "ออม สุชานาฏ" }),
  buildTeamMember({ csId: "may", displayName: "เมย" }),
];

beforeEach(() => {
  resetNavigation();
});

function setup(overrides = {}) {
  return render(
    <ReassignControl
      jobId="JOB-2026-0001"
      currentOwnerCsId="aom"
      currentOwnerName="ออม สุชานาฏ"
      team={TEAM}
      canReassign
      {...overrides}
    />,
  );
}

async function editJobMock() {
  const mod = await import("@/app/(app)/actions");
  return vi.mocked(mod.editJob);
}

describe("ReassignControl", () => {
  it("renders a disabled button when canReassign is false", () => {
    setup({ canReassign: false });
    const btn = screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" });
    expect(btn).toBeDisabled();
  });

  it("opens the dialog on trigger click", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    expect(
      screen.getByRole("dialog", { name: "เปลี่ยนเจ้าของงาน" }),
    ).toBeInTheDocument();
  });

  it("confirm stays disabled until a new owner and reason are given", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    const confirm = screen.getByRole("button", { name: "ยืนยันการเปลี่ยนเจ้าของ" });
    expect(confirm).toBeDisabled();

    await user.selectOptions(screen.getByDisplayValue("— เลือก CS —"), "may");
    expect(confirm).toBeDisabled(); // reason still missing

    await user.type(screen.getByPlaceholderText(/โอนงานเนื่องจาก/), "workload เต็ม");
    await waitFor(() => expect(confirm).toBeEnabled());
  });

  it("confirm is disabled when selecting the same owner", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    await user.selectOptions(screen.getByDisplayValue("— เลือก CS —"), "aom");
    await user.type(screen.getByPlaceholderText(/โอนงานเนื่องจาก/), "เหตุผล");
    expect(
      screen.getByRole("button", { name: "ยืนยันการเปลี่ยนเจ้าของ" }),
    ).toBeDisabled();
  });

  it("shows the old → new summary once a different owner is chosen", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    await user.selectOptions(screen.getByDisplayValue("— เลือก CS —"), "may");
    const dialog = screen.getByRole("dialog", { name: "เปลี่ยนเจ้าของงาน" });
    const summary = dialog.querySelector(".border-primary\\/30") as HTMLElement;
    expect(summary).not.toBeNull();
    expect(summary).toHaveTextContent("ออม สุชานาฏ");
    expect(summary).toHaveTextContent("→");
    expect(summary).toHaveTextContent("เมย");
  });

  it("calls editJob with reason and refreshes on success", async () => {
    const user = userEvent.setup();
    const editJob = await editJobMock();
    editJob.mockResolvedValue({ ok: true } as never);
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    await user.selectOptions(screen.getByDisplayValue("— เลือก CS —"), "may");
    await user.type(screen.getByPlaceholderText(/โอนงานเนื่องจาก/), " ลาพักร้อน ");
    await user.click(screen.getByRole("button", { name: "ยืนยันการเปลี่ยนเจ้าของ" }));

    await waitFor(() => {
      expect(editJob).toHaveBeenCalledWith(
        "JOB-2026-0001",
        { owner: "may" },
        { reason: "ลาพักร้อน" },
      );
      expect(navState.refresh).toHaveBeenCalled();
    });
  });

  it("shows the error and keeps the dialog open when editJob rejects", async () => {
    const user = userEvent.setup();
    const editJob = await editJobMock();
    editJob.mockRejectedValue(new Error("ไม่มีสิทธิ์เปลี่ยนเจ้าของ") as never);
    setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนเจ้าของ" }));
    await user.selectOptions(screen.getByDisplayValue("— เลือก CS —"), "may");
    await user.type(screen.getByPlaceholderText(/โอนงานเนื่องจาก/), "เหตุผล");
    await user.click(screen.getByRole("button", { name: "ยืนยันการเปลี่ยนเจ้าของ" }));

    await waitFor(() =>
      expect(screen.getByText("ไม่มีสิทธิ์เปลี่ยนเจ้าของ")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("dialog", { name: "เปลี่ยนเจ้าของงาน" }),
    ).toBeInTheDocument();
  });
});
