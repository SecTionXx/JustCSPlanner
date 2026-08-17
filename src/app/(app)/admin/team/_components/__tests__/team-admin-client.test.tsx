import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { buildTeamMember } from "@/test/fixtures";

vi.mock("@/app/(app)/admin/actions", () => ({
  createTeamMember: vi.fn().mockResolvedValue({ ok: true }),
  updateTeamMember: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  createTeamMember,
  updateTeamMember,
} from "@/app/(app)/admin/actions";
import { TeamAdminClient } from "@/app/(app)/admin/team/_components/team-admin-client";

const TEAM = [
  buildTeamMember({ csId: "may", displayName: "เมย" }),
  buildTeamMember({ csId: "aom", displayName: "ออม สุชานาฏ" }),
  buildTeamMember({
    csId: "zoe",
    displayName: "โซ",
    active: false,
    role: "cs_assistant",
  }),
];

beforeEach(() => {
  vi.mocked(createTeamMember).mockClear();
  vi.mocked(updateTeamMember).mockClear();
});

function setup(overrides = {}) {
  return render(<TeamAdminClient team={TEAM} canManage {...overrides} />);
}

describe("TeamAdminClient — table", () => {
  it("sorts active members first, then by csId", () => {
    setup();
    const rows = screen.getAllByRole("row").slice(1); // skip header
    const csIds = rows.map(
      (r) => within(r).getByText(/^[a-z]+$/).textContent,
    );
    expect(csIds).toEqual(["aom", "may", "zoe"]);
  });

  it("shows role and status badges per member", () => {
    setup();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("ใช้งาน").length).toBe(2);
    expect(within(table).getByText("ปิดใช้งาน")).toBeInTheDocument();
    // Scoped to the table — the add form's <select> also lists "CS Owner".
    expect(within(table).getAllByText("CS Owner").length).toBe(2);
    expect(within(table).getByText("CS Assistant")).toBeInTheDocument();
  });

  it("hides the add form and edit buttons when canManage is false", () => {
    setup({ canManage: false });
    expect(screen.queryByLabelText(/ชื่อแสดง/)).toBeNull();
    expect(screen.queryByRole("button", { name: "แก้ไข" })).toBeNull();
  });

  it("shows an empty-state row for an empty team", () => {
    setup({ team: [] });
    expect(screen.getByText("ยังไม่มีสมาชิกในทีม")).toBeInTheDocument();
  });
});

describe("TeamAdminClient — add member", () => {
  it("add stays disabled until a display name is entered", async () => {
    const user = userEvent.setup();
    setup();
    const addBtn = screen.getByRole("button", { name: "เพิ่มสมาชิก" });
    expect(addBtn).toBeDisabled();
    await user.type(screen.getByLabelText(/ชื่อแสดง/), "อ้อม");
    expect(addBtn).toBeEnabled();
  });

  it("creates a member with role and optional email, then resets", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/ชื่อแสดง/), "อ้อม");
    await user.selectOptions(screen.getByLabelText(/บทบาท/), "lead");
    await user.type(screen.getByLabelText(/อีเมล/), "oam@example.com");
    await user.click(screen.getByRole("button", { name: "เพิ่มสมาชิก" }));

    await waitFor(() =>
      expect(createTeamMember).toHaveBeenCalledWith({
        displayName: "อ้อม",
        role: "lead",
        email: "oam@example.com",
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/ชื่อแสดง/)).toHaveValue(""),
    );
  });

  it("omits the email when blank", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/ชื่อแสดง/), "นินา");
    await user.click(screen.getByRole("button", { name: "เพิ่มสมาชิก" }));
    await waitFor(() =>
      expect(createTeamMember).toHaveBeenCalledWith({
        displayName: "นินา",
        role: "cs_owner",
        email: undefined,
      }),
    );
  });
});

describe("TeamAdminClient — edit member", () => {
  async function editFirstMember(user: ReturnType<typeof userEvent.setup>) {
    const rows = screen.getAllByRole("row").slice(1);
    await user.click(within(rows[0]).getByRole("button", { name: "แก้ไข" }));
    return rows[0];
  }

  it("saves edits via updateTeamMember", async () => {
    const user = userEvent.setup();
    setup();
    const row = await editFirstMember(user);

    const nameInput = within(row).getByDisplayValue("ออม สุชานาฏ");
    await user.clear(nameInput);
    await user.type(nameInput, "ออม ใหม่");
    await user.click(within(row).getByRole("button", { name: "บันทึก" }));

    await waitFor(() =>
      expect(updateTeamMember).toHaveBeenCalledWith("aom", {
        displayName: "ออม ใหม่",
        role: "cs_owner",
        email: "aom@example.com",
        active: true,
      }),
    );
  });

  it("cancel reverts edits without calling the action", async () => {
    const user = userEvent.setup();
    setup();
    const row = await editFirstMember(user);
    const nameInput = within(row).getByDisplayValue("ออม สุชานาฏ");
    await user.clear(nameInput);
    await user.type(nameInput, "ชื่อชั่วคราว");
    await user.click(within(row).getByRole("button", { name: "ยกเลิก" }));

    expect(updateTeamMember).not.toHaveBeenCalled();
    expect(screen.getByText("ออม สุชานาฏ")).toBeInTheDocument();
  });

  it("toggling active off sends active: false", async () => {
    const user = userEvent.setup();
    setup();
    const row = await editFirstMember(user);
    await user.click(within(row).getByRole("checkbox"));
    await user.click(within(row).getByRole("button", { name: "บันทึก" }));

    await waitFor(() =>
      expect(updateTeamMember).toHaveBeenCalledWith(
        "aom",
        expect.objectContaining({ active: false }),
      ),
    );
  });
});
