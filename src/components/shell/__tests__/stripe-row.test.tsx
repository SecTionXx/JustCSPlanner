import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StripeRow } from "@/components/shell/stripe-row";

describe("StripeRow", () => {
  it("renders title, subtitle, and meta", () => {
    render(
      <StripeRow tone="red" title="JOB-2026-0001" subtitle="ลูกค้า A" meta="2 ชม." />,
    );
    expect(screen.getByText("JOB-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("ลูกค้า A")).toBeInTheDocument();
    expect(screen.getByText("2 ชม.")).toBeInTheDocument();
  });

  it("omits subtitle and meta when not provided", () => {
    render(<StripeRow tone="green" title="only-title" />);
    const row = screen.getByText("only-title").closest("div.flex");
    expect(row?.querySelector("small")).toBeNull();
  });

  it.each([
    ["red", "bg-status-blocked"],
    ["orange", "bg-status-needs-help"],
    ["green", "bg-status-completed"],
    ["purple", "bg-status-new"],
  ] as const)("applies the %s stripe color", (tone, cls) => {
    const { unmount } = render(<StripeRow tone={tone} title="t" />);
    expect(document.querySelector(`span.${cls}`)).not.toBeNull();
    unmount();
  });

  it("wraps in a Link when href is provided", () => {
    render(<StripeRow tone="red" title="linked" href="/jobs/JOB-1" />);
    expect(screen.getByRole("link", { name: /linked/ })).toHaveAttribute(
      "href",
      "/jobs/JOB-1",
    );
  });

  it("renders a plain div without href", () => {
    render(<StripeRow tone="red" title="plain" />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
