import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation, setNavigation } from "@/test/navigation";
import { AssignFilters } from "@/app/(app)/assign/_components/assign-filters";
import { buildTeamMember } from "@/test/fixtures";

const TEAM = [
  buildTeamMember(),
  buildTeamMember({ csId: "may", displayName: "เมย" }),
];

beforeEach(() => {
  resetNavigation();
});

describe("AssignFilters", () => {
  it("renders the owner select with all team members", () => {
    render(<AssignFilters team={TEAM} />);
    const select = screen.getByLabelText("กรองตามเจ้าของงาน") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toContain("เจ้าของ: ทั้งหมด");
    expect(options).toContain("ออม สุชานาฏ");
    expect(options).toContain("เมย");
  });

  it("pushes owner filter to the URL", async () => {
    const user = userEvent.setup();
    render(<AssignFilters team={TEAM} />);
    await user.selectOptions(
      screen.getByLabelText("กรองตามเจ้าของงาน"),
      "may",
    );
    expect(navState.push).toHaveBeenCalledWith("/assign?owner=may");
  });

  it("removes the owner param when ทั้งหมด is selected", async () => {
    const user = userEvent.setup();
    setNavigation({ searchParams: new URLSearchParams("owner=may") });
    render(<AssignFilters team={TEAM} />);
    await user.selectOptions(
      screen.getByLabelText("กรองตามเจ้าของงาน"),
      "",
    );
    expect(navState.push).toHaveBeenCalledWith("/assign");
  });

  it("toggles the overdue chip on", async () => {
    const user = userEvent.setup();
    render(<AssignFilters team={TEAM} />);
    await user.click(screen.getByRole("button", { name: "เกินกำหนด" }));
    expect(navState.push).toHaveBeenCalledWith("/assign?overdue=1");
  });

  it("toggles the overdue chip off when already active", async () => {
    const user = userEvent.setup();
    setNavigation({ searchParams: new URLSearchParams("overdue=1") });
    render(<AssignFilters team={TEAM} />);
    await user.click(screen.getByRole("button", { name: "เกินกำหนด" }));
    expect(navState.push).toHaveBeenCalledWith("/assign");
  });

  it("toggles the near-deadline chip preserving other params", async () => {
    const user = userEvent.setup();
    setNavigation({ searchParams: new URLSearchParams("owner=aom") });
    render(<AssignFilters team={TEAM} />);
    await user.click(screen.getByRole("button", { name: "ใกล้ Deadline" }));
    const call = String(navState.push.mock.calls[0]);
    expect(call).toContain("owner=aom");
    expect(call).toContain("near=1");
  });

  it("marks the active chips as pressed via styling", () => {
    setNavigation({
      searchParams: new URLSearchParams("overdue=1&near=1"),
    });
    render(<AssignFilters team={TEAM} />);
    const overdue = screen.getByRole("button", { name: "เกินกำหนด" });
    expect(overdue.className).toContain("bg-primary");
  });
});
