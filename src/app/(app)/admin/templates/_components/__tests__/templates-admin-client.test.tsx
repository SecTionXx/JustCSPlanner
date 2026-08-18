import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { buildTemplate } from "@/test/fixtures";

vi.mock("@/app/(app)/admin/actions", () => ({
  createTemplate: vi.fn().mockResolvedValue({ ok: true }),
  deleteTemplate: vi.fn().mockResolvedValue({ ok: true }),
  updateTemplate: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "@/app/(app)/admin/actions";
import {
  TemplatesAdminClient,
  type TemplateGroup,
} from "@/app/(app)/admin/templates/_components/templates-admin-client";

const GROUPS: TemplateGroup[] = [
  {
    type: "Export Sea",
    label: "Export Sea",
    rows: [
      buildTemplate({ order: 1, todoTitle: "จองตู้" }),
      buildTemplate({ order: 2, todoTitle: "ส่ง SI", deadlineOffsetHours: 24 }),
    ],
  },
  {
    type: "Air Freight",
    label: "Air Freight",
    rows: [],
  },
];

beforeEach(() => {
  vi.mocked(createTemplate).mockClear();
  vi.mocked(deleteTemplate).mockClear();
  vi.mocked(updateTemplate).mockClear();
});

function setup(overrides = {}) {
  return render(
    <TemplatesAdminClient groups={GROUPS} canManage {...overrides} />,
  );
}

function groupSection(label: string): HTMLElement {
  return screen.getByRole("heading", { name: label }).closest("section")!;
}

describe("TemplatesAdminClient — rendering", () => {
  it("renders each group with its row count", () => {
    setup();
    expect(screen.getByText("Export Sea")).toBeInTheDocument();
    expect(screen.getByText("2 รายการ")).toBeInTheDocument();
    expect(screen.getByText("0 รายการ")).toBeInTheDocument();
  });

  it("shows the empty-state row for a group with no templates", () => {
    setup();
    expect(
      screen.getByText("ยังไม่มีเทมเพลตสำหรับประเภทนี้"),
    ).toBeInTheDocument();
  });

  it("hides action columns when canManage is false", () => {
    setup({ canManage: false });
    expect(screen.queryByRole("button", { name: "แก้ไข" })).toBeNull();
    expect(screen.queryByRole("button", { name: "+ เพิ่ม To-do ในกลุ่มนี้" })).toBeNull();
  });
});

describe("TemplatesAdminClient — edit row", () => {
  it("saves edits via updateTemplate", async () => {
    const user = userEvent.setup();
    setup();
    const row = screen.getByText("ส่ง SI").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "แก้ไข" }));

    const titleInput = within(row).getByDisplayValue("ส่ง SI");
    await user.clear(titleInput);
    await user.type(titleInput, "ส่ง SI ให้ลูกค้า");
    const offsetInput = within(row).getByDisplayValue("24");
    await user.clear(offsetInput);
    await user.type(offsetInput, "48");
    await user.click(within(row).getByRole("button", { name: "บันทึก" }));

    await waitFor(() =>
      expect(updateTemplate).toHaveBeenCalledWith(
        "Export Sea",
        2,
        {
          todoTitle: "ส่ง SI ให้ลูกค้า",
          deadlineOffsetHours: 48,
          notes: undefined,
        },
      ),
    );
  });

  it("keeps save disabled for an empty title", async () => {
    const user = userEvent.setup();
    setup();
    const row = screen.getByText("จองตู้").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "แก้ไข" }));
    const titleInput = within(row).getByDisplayValue("จองตู้");
    await user.clear(titleInput);
    expect(within(row).getByRole("button", { name: "บันทึก" })).toBeDisabled();
  });

  it("cancel reverts edits without calling the action", async () => {
    const user = userEvent.setup();
    setup();
    const row = screen.getByText("จองตู้").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "แก้ไข" }));
    const titleInput = within(row).getByDisplayValue("จองตู้");
    await user.clear(titleInput);
    await user.type(titleInput, "ชั่วคราว");
    await user.click(within(row).getByRole("button", { name: "ยกเลิก" }));

    expect(updateTemplate).not.toHaveBeenCalled();
    expect(screen.getByText("จองตู้")).toBeInTheDocument();
  });

  it("deletes via deleteTemplate", async () => {
    const user = userEvent.setup();
    setup();
    const row = screen.getByText("จองตู้").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "ลบ" }));
    await waitFor(() =>
      expect(deleteTemplate).toHaveBeenCalledWith("Export Sea", 1),
    );
  });
});

describe("TemplatesAdminClient — add row", () => {
  it("creates a template with the next order in the group", async () => {
    const user = userEvent.setup();
    setup();
    const section = groupSection("Air Freight");
    await user.click(
      within(section).getByRole("button", { name: "+ เพิ่ม To-do ในกลุ่มนี้" }),
    );

    const titleInput = within(section).getByPlaceholderText(/ตรวจ Booking/);
    await user.type(titleInput, "ตรวจ AWB");
    const offsetInput = within(section).getByDisplayValue("0");
    await user.clear(offsetInput);
    await user.type(offsetInput, "12");
    await user.click(within(section).getByRole("button", { name: "เพิ่ม" }));

    await waitFor(() =>
      expect(createTemplate).toHaveBeenCalledWith({
        templateType: "Air Freight",
        order: 1,
        todoTitle: "ตรวจ AWB",
        deadlineOffsetHours: 12,
        notes: undefined,
      }),
    );
  });

  it("keeps add disabled until a title is entered", async () => {
    const user = userEvent.setup();
    setup();
    const section = groupSection("Air Freight");
    await user.click(
      within(section).getByRole("button", { name: "+ เพิ่ม To-do ในกลุ่มนี้" }),
    );
    expect(within(section).getByRole("button", { name: "เพิ่ม" })).toBeDisabled();
  });
});
