import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation } from "@/test/navigation";
import { buildJob, buildTeamMember } from "@/test/fixtures";

vi.mock("@/app/(app)/actions", () => ({
  editJob: vi.fn().mockResolvedValue(undefined),
}));

import { editJob } from "@/app/(app)/actions";
import { EditJobForm } from "@/app/(app)/jobs/[id]/edit/_components/edit-job-form";

const editJobMock = vi.mocked(editJob);

const TEAM = [
  buildTeamMember({ csId: "aom", displayName: "ออม สุชานาฏ" }),
  buildTeamMember({ csId: "may", displayName: "เมย" }),
];

// Bangkok-timezone ISO deadline — validates the ISO → datetime-local → ISO round-trip.
const JOB = buildJob({
  jobId: "JOB-2026-0007",
  owner: "aom",
  deadline: "2026-08-25T17:30:00.000+07:00",
  etd: "2026-08-26T09:00:00.000+07:00",
  eta: undefined,
  carrier: "ONE",
  docLinks: ["https://a", "https://b"],
  latestSummary: "สรุปเดิม",
});

beforeEach(() => {
  resetNavigation();
  editJobMock.mockClear();
  editJobMock.mockResolvedValue(undefined);
});

function setup(overrides = {}) {
  return render(
    <EditJobForm
      job={JOB}
      team={TEAM}
      canReassign
      canChangeDeadline
      {...overrides}
    />,
  );
}

describe("EditJobForm — initial values", () => {
  it("converts ISO deadlines to datetime-local inputs (round-trip part 1)", () => {
    setup();
    expect(screen.getByLabelText(/Deadline/)).toHaveValue("2026-08-25T17:30");
    expect(screen.getByLabelText("ETD")).toHaveValue("2026-08-26T09:00");
    expect(screen.getByLabelText("ETA")).toHaveValue("");
  });

  it("prefills text fields and joined docLinks", () => {
    setup();
    expect(screen.getByLabelText(/ลูกค้า/)).toHaveValue(JOB.customer);
    expect(screen.getByLabelText(/Carrier/)).toHaveValue("ONE");
    expect(screen.getByLabelText(/ลิงก์เอกสาร/)).toHaveValue("https://a\nhttps://b");
    expect(screen.getByLabelText(/Note \/ สรุปล่าสุด/)).toHaveValue("สรุปเดิม");
  });

  it("disables owner/deadline when permissions are off", () => {
    setup({ canReassign: false, canChangeDeadline: false });
    expect(screen.getByLabelText(/Assign ให้/)).toBeDisabled();
    expect(screen.getByLabelText(/Deadline/)).toBeDisabled();
  });
});

describe("EditJobForm — submit", () => {
  it("sends a patch with ISO +07:00 round-tripped from the local input", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/Carrier/), " Extra");
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

    await waitFor(() => expect(editJobMock).toHaveBeenCalledTimes(1));
    const [jobId, patch, opts] = editJobMock.mock.calls[0];
    expect(jobId).toBe("JOB-2026-0007");
    // datetime-local "2026-08-25T17:30" → ISO +07:00
    expect(patch.deadline).toBe("2026-08-25T17:30:00+07:00");
    expect(patch.etd).toBe("2026-08-26T09:00:00+07:00");
    expect(patch.docLinks).toEqual(["https://a", "https://b"]);
    expect(opts).toBeUndefined(); // no owner/deadline change → no reason
  });

  it("navigates back to the job detail on success", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
    await waitFor(() =>
      expect(navState.push).toHaveBeenCalledWith("/jobs/JOB-2026-0007"),
    );
  });

  it("changing the owner requires a reason and sends it", async () => {
    const user = userEvent.setup();
    setup();

    await user.selectOptions(screen.getByLabelText(/Assign ให้/), "may");
    expect(
      screen.getByText(/ต้องมีเหตุผล \(High-trust\)/),
    ).toBeInTheDocument();

    // Submitting with only whitespace is blocked client-side (a real reason
    // is required — HTML5 `required` only rejects fully empty input).
    await user.type(
      screen.getByPlaceholderText("เหตุผลในการเปลี่ยนแปลง"),
      "   ",
    );
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
    expect(editJobMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("การเปลี่ยน Owner หรือ Deadline ต้องมีเหตุผล"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("เหตุผลในการเปลี่ยนแปลง"),
      "โอนงานให้เมย",
    );
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
    await waitFor(() => expect(editJobMock).toHaveBeenCalledTimes(1));
    const [, patch, opts] = editJobMock.mock.calls[0];
    expect(patch.owner).toBe("may");
    expect(opts).toEqual({ reason: "โอนงานให้เมย" });
  });

  it("changing the deadline also requires a reason", async () => {
    const user = userEvent.setup();
    setup();
    await user.clear(screen.getByLabelText(/Deadline/));
    await user.type(screen.getByLabelText(/Deadline/), "2026-08-27T10:00");
    await user.type(
      screen.getByPlaceholderText("เหตุผลในการเปลี่ยนแปลง"),
      "ลูกค้าเลื่อน",
    );
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
    await waitFor(() => expect(editJobMock).toHaveBeenCalledTimes(1));
    const [jobId, patch, opts] = editJobMock.mock.calls[0];
    expect(jobId).toBe("JOB-2026-0007");
    expect(patch.deadline).toBe("2026-08-27T10:00:00+07:00");
    expect(opts).toEqual({ reason: "ลูกค้าเลื่อน" });
  });

  it("shows the error and stays put when editJob rejects", async () => {
    const user = userEvent.setup();
    editJobMock.mockRejectedValue(new Error("สิทธิ์ไม่พอ"));
    setup();
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
    await waitFor(() => expect(screen.getByText("สิทธิ์ไม่พอ")).toBeInTheDocument());
    expect(navState.push).not.toHaveBeenCalled();
  });

  it("cancel links back to the job detail", () => {
    setup();
    // Base UI Button with render={<Link/>} keeps role="button" on the <a>.
    const cancel = screen.getByRole("button", { name: "ยกเลิก" });
    expect(cancel.tagName).toBe("A");
    expect(cancel).toHaveAttribute("href", "/jobs/JOB-2026-0007");
  });
});
