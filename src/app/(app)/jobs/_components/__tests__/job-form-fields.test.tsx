import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { JobFormFields } from "@/app/(app)/jobs/_components/job-form-fields";
import { buildTeamMember } from "@/test/fixtures";

const TEAM = [
  buildTeamMember(),
  buildTeamMember({ csId: "may", displayName: "เมย", role: "cs_assistant" }),
  buildTeamMember({ csId: "old", displayName: "อดีตสมาชิก", active: false }),
];

const CREATE_VALUES = {
  title: "",
  customer: "บริษัท ก",
  owner: "aom",
  deadline: "2026-08-20T17:00",
  status: "New" as const,
  shipmentType: "FCL" as const,
  serviceType: "Export Sea" as const,
  priority: "Normal" as const,
  bookingNumber: "",
  route: "",
  carrier: "",
  etd: "",
  eta: "",
  docLinks: "",
  note: "",
};

// Controlled harness — the real forms hold values in state, so mimic that
// instead of passing a frozen object (typing against a static value fights
// React's controlled-input reset).
function ControlledForm({
  onChange,
  ...props
}: {
  values: typeof CREATE_VALUES;
  onChange?: (key: string, value: string) => void;
  mode?: "create" | "edit";
}) {
  const [values, setValues] = React.useState(props.values);
  const handleChange = (key: string, value: string): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    onChange?.(key, value);
  };
  return (
    <JobFormFields
      values={values}
      onChange={handleChange}
      team={TEAM}
      mode={props.mode ?? "create"}
    />
  );
}

function setupCreate(overrides: Partial<typeof CREATE_VALUES> = {}) {
  const onChange = vi.fn();
  render(
    <ControlledForm
      values={{ ...CREATE_VALUES, ...overrides }}
      onChange={onChange}
    />,
  );
  return { onChange };
}

describe("JobFormFields — create mode", () => {
  it("renders the title field and note textarea only in create mode", () => {
    setupCreate();
    expect(screen.getByLabelText(/ชื่องาน \/ Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Note \/ หมายเหตุเริ่มต้น/)).toBeInTheDocument();
  });

  it("renders edit-mode summary instead of title/note", () => {
    render(
      <JobFormFields
        values={{
          customer: "c",
          owner: "aom",
          deadline: "2026-08-20T17:00",
          status: "New",
          shipmentType: "FCL",
          serviceType: "Export Sea",
          priority: "Normal",
          bookingNumber: "",
          route: "",
          carrier: "",
          etd: "",
          eta: "",
          docLinks: "",
          latestSummary: "สรุปเดิม",
        }}
        onChange={vi.fn()}
        team={TEAM}
        mode="edit"
      />,
    );
    expect(screen.queryByLabelText(/ชื่องาน/)).toBeNull();
    expect(screen.getByLabelText(/Note \/ สรุปล่าสุด/)).toHaveValue("สรุปเดิม");
  });

  it("binds values to inputs and reports changes with the field key", async () => {
    const user = userEvent.setup();
    const { onChange } = setupCreate({ customer: "" });
    const input = screen.getByLabelText(/ลูกค้า/);
    await user.type(input, "บริษัท ข");
    expect(onChange).toHaveBeenLastCalledWith("customer", "บริษัท ข");
    expect(input).toHaveValue("บริษัท ข");
  });

  it("reports shipment type chip changes", async () => {
    const user = userEvent.setup();
    const { onChange } = setupCreate();
    await user.click(screen.getByRole("button", { name: "Air" }));
    expect(onChange).toHaveBeenCalledWith("shipmentType", "Air");
  });

  it("reports status and priority chip changes with Thai labels resolved", async () => {
    const user = userEvent.setup();
    const { onChange } = setupCreate();
    await user.click(screen.getByRole("button", { name: "ด่วนมาก" }));
    expect(onChange).toHaveBeenCalledWith("priority", "Critical");
    await user.click(screen.getByRole("button", { name: "เสร็จสิ้น" }));
    expect(onChange).toHaveBeenCalledWith("status", "Completed");
  });

  it("offers only active team members in create mode", () => {
    setupCreate();
    const ownerSelect = screen.getByLabelText(/Assign ให้/) as HTMLSelectElement;
    const options = Array.from(ownerSelect.options).map((o) => o.value);
    expect(options).toContain("aom");
    expect(options).toContain("may");
    expect(options).not.toContain("old");
  });

  it("reports owner changes", async () => {
    const user = userEvent.setup();
    const { onChange } = setupCreate();
    await user.selectOptions(screen.getByLabelText(/Assign ให้/), "may");
    expect(onChange).toHaveBeenCalledWith("owner", "may");
  });

  it("reports datetime changes for deadline", async () => {
    const user = userEvent.setup();
    const { onChange } = setupCreate({ deadline: "" });
    await user.type(screen.getByLabelText(/Deadline/), "2026-08-21T09:30");
    expect(onChange).toHaveBeenLastCalledWith("deadline", "2026-08-21T09:30");
  });

  it("restricts status options to statusSubset when provided", () => {
    render(
      <JobFormFields
        values={{ ...CREATE_VALUES }}
        onChange={vi.fn()}
        team={TEAM}
        mode="create"
        statusSubset={["New", "In Progress", "Completed"]}
      />,
    );
    expect(screen.getByRole("button", { name: "ใหม่" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "กำลังดำเนินการ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ติดขัด" })).toBeNull();
  });

  it("disables owner and deadline when flags are set", () => {
    render(
      <JobFormFields
        values={{ ...CREATE_VALUES }}
        onChange={vi.fn()}
        team={TEAM}
        mode="edit"
        ownerDisabled
        deadlineDisabled
      />,
    );
    expect(screen.getByLabelText(/Assign ให้/)).toBeDisabled();
    expect(screen.getByLabelText(/Deadline/)).toBeDisabled();
  });
});
