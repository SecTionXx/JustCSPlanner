import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PriorityBadge } from "@/components/shell/priority-badge";

describe("PriorityBadge", () => {
  it("renders the Thai label per priority", () => {
    const normal = render(<PriorityBadge priority="Normal" />);
    expect(screen.getByText("ปกติ")).toBeInTheDocument();
    normal.unmount();

    const high = render(<PriorityBadge priority="High" />);
    expect(screen.getByText("ด่วน")).toBeInTheDocument();
    high.unmount();
  });

  it("renders Critical", () => {
    render(<PriorityBadge priority="Critical" />);
    expect(screen.getByText("ด่วนมาก")).toBeInTheDocument();
  });

  it("falls back to Normal for an invalid priority", () => {
    render(<PriorityBadge priority="urgent?!" />);
    expect(screen.getByText("ปกติ")).toBeInTheDocument();
  });

  it("lets the label prop override the displayed text", () => {
    render(<PriorityBadge priority="High" label="P1" />);
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.queryByText("ด่วน")).not.toBeInTheDocument();
  });
});
