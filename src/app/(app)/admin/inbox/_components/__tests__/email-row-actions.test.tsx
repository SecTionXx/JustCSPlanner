import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(app)/admin/inbox/actions", () => ({
  addEmail: vi.fn(),
  ignoreEmail: vi.fn().mockResolvedValue({ ok: true }),
  linkEmailToJob: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  ignoreEmail,
  linkEmailToJob,
} from "@/app/(app)/admin/inbox/actions";
import { EmailRowActions } from "@/app/(app)/admin/inbox/_components/email-row-actions";

const JOBS = [
  { jobId: "JOB-2026-0001", customer: "บริษัท ก" },
  { jobId: "JOB-2026-0002", customer: "บริษัท ข", bookingNumber: "BK-12345" },
];

beforeEach(() => {
  vi.mocked(linkEmailToJob).mockClear();
  vi.mocked(ignoreEmail).mockClear();
});

function setup(overrides = {}) {
  return render(
    <EmailRowActions emailId="EMAIL-000001" jobs={JOBS} {...overrides} />,
  );
}

describe("EmailRowActions", () => {
  it("preselects the suggested job", () => {
    setup({ suggestedJobId: "JOB-2026-0002" });
    const select = screen.getByLabelText("เลือกงานที่จะเชื่อม") as HTMLSelectElement;
    expect(select.value).toBe("JOB-2026-0002");
    expect(
      screen.getByText(/แนะนำจากเลข booking หรือชื่อลูกค้า/),
    ).toBeInTheDocument();
  });

  it("linking without choosing a job shows a Thai error", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "เชื่อมกับงาน" }));
    expect(screen.getByText("กรุณาเลือกงานก่อนเชื่อม")).toBeInTheDocument();
    expect(linkEmailToJob).not.toHaveBeenCalled();
  });

  it("links the chosen job via linkEmailToJob", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(
      screen.getByLabelText("เลือกงานที่จะเชื่อม"),
      "JOB-2026-0001",
    );
    await user.click(screen.getByRole("button", { name: "เชื่อมกับงาน" }));
    await waitFor(() =>
      expect(linkEmailToJob).toHaveBeenCalledWith("EMAIL-000001", "JOB-2026-0001"),
    );
  });

  it("ข้าม calls ignoreEmail with the email id", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "ข้าม" }));
    await waitFor(() =>
      expect(ignoreEmail).toHaveBeenCalledWith("EMAIL-000001"),
    );
  });

  it("hides the AI draft action when aiHref is absent", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: /ร่างงานใหม่ \(AI\)/ }),
    ).toBeNull();
  });

  it("AI draft action links to the provided href", () => {
    setup({ aiHref: "/jobs/new?aiText=hello" });
    // Base UI Button render={<Link/>} keeps role="button" on the <a>.
    const ai = screen.getByRole("button", { name: /ร่างงานใหม่ \(AI\)/ });
    expect(ai.tagName).toBe("A");
    expect(ai).toHaveAttribute("href", "/jobs/new?aiText=hello");
  });

  it("disables the select and link when no jobs are available", () => {
    setup({ jobs: [] });
    expect(screen.getByLabelText("เลือกงานที่จะเชื่อม")).toBeDisabled();
    expect(screen.getByRole("button", { name: "เชื่อมกับงาน" })).toBeDisabled();
    expect(screen.getByText("ไม่มีงานให้เชื่อม")).toBeInTheDocument();
  });
});
