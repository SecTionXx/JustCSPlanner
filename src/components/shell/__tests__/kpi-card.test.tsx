import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KpiCard } from "@/components/shell/kpi-card";

describe("KpiCard", () => {
  it("renders label and value", () => {
    render(<KpiCard label="งานทั้งหมด" value={12} />);
    expect(screen.getByText("งานทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("applies tone text classes", () => {
    render(<KpiCard label="L" value={1} tone="danger" />);
    expect(screen.getByText("1").className).toContain("text-status-blocked");
  });

  it("defaults to default tone", () => {
    render(<KpiCard label="L" value={1} />);
    expect(screen.getByText("1").className).toContain("text-foreground");
  });

  it("renders a plain div without href", () => {
    render(<KpiCard label="L" value={1} />);
    expect(
      document.querySelector("a[href='/jobs']"),
    ).toBeNull();
  });

  it("renders as a link to href when provided", () => {
    render(<KpiCard label="L" value={1} href="/jobs" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jobs");
    expect(link.textContent).toContain("1");
  });
});

describe("KpiCard interactions", () => {
  it("link click navigates (anchor default)", async () => {
    const user = userEvent.setup();
    render(<KpiCard label="L" value={1} href="/jobs" />);
    await user.click(screen.getByRole("link"));
    expect(screen.getByRole("link")).toHaveAttribute("href", "/jobs");
  });

  it("does not crash without onClick handlers", () => {
    const onClick = vi.fn();
    expect(onClick).not.toHaveBeenCalled();
    render(<KpiCard label="L" value="x" />);
  });
});
