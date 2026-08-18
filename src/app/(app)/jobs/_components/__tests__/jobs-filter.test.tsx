import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import "@/test/navigation";
import { navState, resetNavigation, setNavigation } from "@/test/navigation";
import { JobsFilter } from "@/app/(app)/jobs/_components/jobs-filter";

beforeEach(() => {
  resetNavigation();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(params?: string) {
  if (params) setNavigation({ searchParams: new URLSearchParams(params) });
  return render(<JobsFilter />);
}

describe("JobsFilter — status chips", () => {
  it("pushes /jobs?status=... when a status chip is clicked", async () => {
    const user = await importUser();
    setup();
    await user.click(screen.getByRole("button", { name: "กำลังดำเนินการ" }));
    // URLSearchParams encodes spaces as "+"
    expect(navState.push).toHaveBeenCalledWith("/jobs?status=In+Progress");
  });

  it("removes the status param when ทั้งหมด is clicked", async () => {
    const user = await importUser();
    setup("status=Blocked");
    await user.click(screen.getByRole("button", { name: "ทั้งหมด" }));
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });

  it("preserves existing params when changing status", async () => {
    const user = await importUser();
    setup("q=abc");
    await user.click(screen.getByRole("button", { name: "ติดขัด" }));
    const calls = navState.push.mock.calls.map(String);
    expect(calls[0]).toContain("q=abc");
    expect(calls[0]).toContain("status=Blocked");
  });
});

describe("JobsFilter — view toggle", () => {
  it("pushes view=list and removes it for grid", async () => {
    const user = await importUser();
    setup();
    await user.click(screen.getByRole("button", { name: "มุมมองรายการ" }));
    expect(navState.push).toHaveBeenCalledWith("/jobs?view=list");

    navState.push.mockClear();
    setNavigation({ searchParams: new URLSearchParams("view=list") });
    await user.click(screen.getByRole("button", { name: "มุมมองการ์ด" }));
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });
});

describe("JobsFilter — debounced search", () => {
  it("does not push before 350ms and pushes the query after", async () => {
    const user = await importUser();
    setup();
    await user.type(screen.getByPlaceholderText(/ค้นหาชื่อลูกค้า/), "BK-9");
    expect(navState.push).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(navState.push).toHaveBeenCalledWith("/jobs?q=BK-9");
  });

  it("clearing the search removes the q param", async () => {
    const user = await importUser();
    setup("q=abc");
    await user.clear(screen.getByPlaceholderText(/ค้นหาชื่อลูกค้า/));
    vi.advanceTimersByTime(400);
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });
});

describe("JobsFilter — clear button", () => {
  it("is hidden when no filters are active", () => {
    setup();
    expect(screen.queryByRole("button", { name: /ล้างตัวกรอง/ })).toBeNull();
  });

  it("is visible when only view=list is set", () => {
    setup("view=list");
    expect(
      screen.getByRole("button", { name: /ล้างตัวกรอง/ }),
    ).toBeInTheDocument();
  });

  it("is visible when only a page param is set", () => {
    setup("page=3");
    expect(
      screen.getByRole("button", { name: /ล้างตัวกรอง/ }),
    ).toBeInTheDocument();
  });

  it("resets to /jobs when filters are active", async () => {
    const user = await importUser();
    setup("status=New");
    await user.click(screen.getByRole("button", { name: /ล้างตัวกรอง/ }));
    expect(navState.push).toHaveBeenCalledWith("/jobs");
  });
});

// Helper so each describe block can build a user-event bound to fake timers.
async function importUser() {
  const mod = await import("@testing-library/user-event");
  return mod.default.setup({ advanceTimers: vi.advanceTimersByTime });
}
