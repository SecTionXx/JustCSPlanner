import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  classifyStatus,
  StatusBadge,
  type StatusCategory,
} from "@/components/shell/status-badge";

describe("classifyStatus", () => {
  const cases: Array<[string, StatusCategory]> = [
    // empty
    ["", "new"],
    ["   ", "new"],
    // danger
    ["overdue", "danger"],
    ["เกินกำหนด", "danger"],
    ["งานค้าง", "danger"],
    ["เลยกำหนด", "danger"],
    ["Blocked", "danger"],
    ["Needs Help", "danger"],
    ["ติดอยู่", "danger"],
    ["ช่วยเหลือ", "danger"],
    // warning
    ["due soon", "warning"],
    ["ใกล้กำหนด", "warning"],
    ["cut-off", "warning"],
    ["cutoff", "warning"],
    ["warning", "warning"],
    // waiting
    ["Waiting Customer", "waiting"],
    ["รอลูกค้า", "waiting"],
    ["รอเอกสาร", "waiting"],
    ["รอ", "waiting"],
    // done
    ["Completed", "done"],
    ["done", "done"],
    ["เสร็จ", "done"],
    ["สำเร็จ", "done"],
    ["complete", "done"],
    // in_progress
    ["In Progress", "in_progress"],
    ["กำลังดำเนินการ", "in_progress"],
    ["ดำเนินการ", "in_progress"],
    ["ongoing", "in_progress"],
    ["processing", "in_progress"],
    // new
    ["New", "new"],
    ["ใหม่", "new"],
    ["draft", "new"],
    ["ร่าง", "new"],
    // unknown fallback
    ["zzz-unknown", "in_progress"],
  ];

  it.each(cases)('classifyStatus("%s") → %s', (input, expected) => {
    expect(classifyStatus(input)).toBe(expected);
  });

  it("danger wins over other categories", () => {
    expect(classifyStatus("overdue waiting")).toBe("danger");
  });

  it("warning wins over waiting/done/new", () => {
    expect(classifyStatus("due soon waiting")).toBe("warning");
  });
});

describe("StatusBadge", () => {
  it("renders the Thai label for a canonical status", () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText("กำลังดำเนินการ")).toBeInTheDocument();
  });

  it("renders an unknown status via toJobStatus fallback", () => {
    render(<StatusBadge status="รอลูกค้า" />);
    expect(screen.getByText("รอลูกค้า")).toBeInTheDocument();
  });

  it("falls back to New styling for unrecognized strings", () => {
    render(<StatusBadge status="zzz" />);
    expect(screen.getByText("ใหม่")).toBeInTheDocument();
  });

  it("lets the label prop override the displayed text", () => {
    render(<StatusBadge status="New" label="CUSTOM" />);
    expect(screen.getByText("CUSTOM")).toBeInTheDocument();
    expect(screen.queryByText("ใหม่")).not.toBeInTheDocument();
  });
});
