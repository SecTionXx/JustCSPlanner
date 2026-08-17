import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation } from "@/test/navigation";
import type { JobDraft } from "@/lib/ai/schema";
import { buildTeamMember } from "@/test/fixtures";

vi.mock("@/app/(app)/actions", () => ({
  createJob: vi.fn(),
}));

// Mock the AI panel child so this file tests the form; the panel has its own file.
vi.mock("@/app/(app)/jobs/new/_components/ai-draft-panel", () => ({
  AiDraftPanel: ({
    initialText,
    onApply,
  }: {
    initialText?: string;
    onApply: (draft: JobDraft) => void;
  }) => (
    <div>
      <span data-testid="ai-initial">{initialText ?? ""}</span>
      <button
        type="button"
        onClick={() =>
          onApply({
            customer: "ลูกค้าจาก AI",
            booking_number: "BK-AI-1",
            origin: "Bangkok",
            destination: "Singapore",
            deadline: "2026-08-25T17:00:00.000+07:00",
            shipment_type: "Air",
            summary: "สรุปจาก AI",
            suggested_todos: ["ส่ง SI"],
            missing_information: ["carrier"],
            confidence: "high",
          })
        }
      >
        apply-draft
      </button>
    </div>
  ),
}));

import { CreateJobForm } from "@/app/(app)/jobs/new/_components/create-job-form";

const TEAM = [
  buildTeamMember(),
  buildTeamMember({ csId: "may", displayName: "เมย" }),
];

beforeEach(() => {
  resetNavigation();
});

describe("CreateJobForm", () => {
  it("renders the form with required fields and notices", () => {
    render(<CreateJobForm team={TEAM} />);
    expect(screen.getByLabelText(/ลูกค้า/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deadline/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Assign ให้/)).toBeInTheDocument();
    expect(screen.getByText(/สร้าง Job Card พร้อม To-do/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "สร้างงานและแจ้ง CS" }),
    ).toBeInTheDocument();
  });

  it("cancel links back to /jobs", () => {
    render(<CreateJobForm team={TEAM} />);
    // Base UI Button with render={<Link/>} keeps role="button" on the <a>.
    const cancel = screen.getByRole("button", { name: "ยกเลิก" });
    expect(cancel.tagName).toBe("A");
    expect(cancel).toHaveAttribute("href", "/jobs");
  });

  it("posts the form to the createJob server action", () => {
    render(<CreateJobForm team={TEAM} />);
    const form = screen.getByRole("button", {
      name: "สร้างงานและแจ้ง CS",
    }).closest("form");
    expect(form).toHaveAttribute("action");
  });

  it("mirrors chip-managed fields as hidden inputs", async () => {
    const user = userEvent.setup();
    render(<CreateJobForm team={TEAM} />);
    const form = document.querySelector("form")!;
    const hidden = (name: string) =>
      Array.from(form.querySelectorAll("input[type='hidden']")).find(
        (el) => el.getAttribute("name") === name,
      ) as HTMLInputElement | undefined;

    expect(hidden("status")?.value).toBe("New");
    expect(hidden("shipmentType")?.value).toBe("FCL");
    expect(hidden("priority")?.value).toBe("Normal");
    expect(hidden("serviceType")?.value).toBe("Export Sea");

    await user.click(screen.getByRole("button", { name: "Air" }));
    await user.click(screen.getByRole("button", { name: "ด่วน" }));
    expect(hidden("shipmentType")?.value).toBe("Air");
    expect(hidden("priority")?.value).toBe("High");
  });

  it("hides the AI panel when aiEnabled is false", () => {
    render(<CreateJobForm team={TEAM} />);
    expect(screen.queryByTestId("ai-initial")).toBeNull();
  });

  it("applies an AI draft into the form without overwriting untouched fields", async () => {
    const user = userEvent.setup();
    render(<CreateJobForm team={TEAM} aiEnabled />);

    // Pre-type a customer — the apply step must not clobber user text? No:
    // apply only skips EMPTY fields, so pre-typed values ARE replaced by design.
    await user.type(screen.getByLabelText(/ลูกค้า/), "ลูกค้าที่พิมพ์เอง");
    await user.click(screen.getByRole("button", { name: "apply-draft" }));

    expect(screen.getByLabelText(/ลูกค้า/)).toHaveValue("ลูกค้าจาก AI");
    expect(screen.getByLabelText(/Booking No\./)).toHaveValue("BK-AI-1");
    expect(screen.getByLabelText(/Route/)).toHaveValue("Bangkok → Singapore");
    expect(screen.getByLabelText(/Deadline/)).toHaveValue("2026-08-25T17:00");
    expect(screen.getByLabelText(/ชื่องาน \/ Title/)).toHaveValue("สรุปจาก AI");
    // Air shipment in the draft maps to the Air chip and Air Freight service.
    expect(screen.getByRole("button", { name: "Air" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/Service Type/)).toHaveValue("Air Freight");
    // suggested_todos are appended to the note.
    expect(screen.getByLabelText(/Note \/ หมายเหตุเริ่มต้น/).textContent).toContain(
      "- ส่ง SI",
    );
  });

  it("passes initialAiText to the AI panel only", () => {
    render(<CreateJobForm team={TEAM} aiEnabled initialAiText="ข้อความ booking" />);
    expect(screen.getByTestId("ai-initial")).toHaveTextContent("ข้อความ booking");
  });

  it("strips the ?aiText param once on mount", () => {
    render(<CreateJobForm team={TEAM} aiEnabled initialAiText="x" />);
    expect(navState.replace).toHaveBeenCalledWith("/jobs/new");
  });
});
