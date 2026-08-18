import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { KpiSkeleton, Skeleton } from "@/components/shell/skeleton";

describe("Skeleton", () => {
  it("renders a pulsing block with data-slot marker", () => {
    render(<Skeleton />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.className).toContain("animate-pulse");
  });

  it("passes through extra props and className", () => {
    render(<Skeleton data-testid="sk" className="h-4 w-full" />);
    expect(screen.getByTestId("sk").className).toContain("h-4");
  });
});

describe("KpiSkeleton", () => {
  it("renders 4 skeleton cards by default", () => {
    const { container } = render(<KpiSkeleton />);
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(4);
  });

  it("renders a custom count", () => {
    const { container } = render(<KpiSkeleton count={6} />);
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(6);
  });
});
