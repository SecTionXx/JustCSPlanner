import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation } from "@/test/navigation";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobTabs } from "@/app/(app)/jobs/[id]/_components/job-tabs";

beforeEach(() => {
  resetNavigation();
});

function setup(tab: "overview" | "todos" = "overview") {
  return render(
    <JobTabs tab={tab}>
      <TabsList>
        <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
        <TabsTrigger value="todos">To-do</TabsTrigger>
      </TabsList>
    </JobTabs>,
  );
}

describe("JobTabs — ?tab= URL sync", () => {
  it("marks the tab matching the value prop as active", () => {
    setup("todos");
    expect(
      screen.getByRole("tab", { name: "To-do" }).hasAttribute("data-active"),
    ).toBe(true);
  });

  it("replaces the URL with ?tab= when a tab is clicked", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "To-do" }));
    expect(navState.replace).toHaveBeenCalledWith("?tab=todos", {
      scroll: false,
    });
  });

  it("follows a new tab value on rerender (controlled)", () => {
    const view = setup("overview");
    expect(
      screen.getByRole("tab", { name: "ภาพรวม" }).hasAttribute("data-active"),
    ).toBe(true);
    view.rerender(
      <JobTabs tab="todos">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="todos">To-do</TabsTrigger>
        </TabsList>
      </JobTabs>,
    );
    expect(
      screen.getByRole("tab", { name: "To-do" }).hasAttribute("data-active"),
    ).toBe(true);
  });
});
