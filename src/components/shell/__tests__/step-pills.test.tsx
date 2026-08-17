import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StepPills } from "@/components/shell/step-pills";

function setup(steps: string[], current: number) {
  const { container } = render(<StepPills steps={steps} current={current} />);
  const pills = steps.map((s) => screen.getByText(s));
  return { container, pills };
}

describe("StepPills", () => {
  const steps = ["รับงาน", "จัดเตรียมเอกสาร", "ส่งมอบ"];

  it("renders every step in order", () => {
    setup(steps, 0);
    const texts = steps.map((s) => screen.getByText(s).textContent);
    expect(texts).toEqual(steps);
  });

  it("highlights the current step", () => {
    const { pills } = setup(steps, 1);
    expect(pills[1].className).toContain("font-bold");
    expect(pills[1].className).toContain("bg-secondary");
  });

  it("mutes non-current steps", () => {
    const { pills } = setup(steps, 1);
    expect(pills[0].className).toContain("bg-muted");
    expect(pills[2].className).toContain("bg-muted");
  });

  it("handles current = 0 (first active)", () => {
    const { pills } = setup(steps, 0);
    expect(pills[0].className).toContain("bg-secondary");
  });
});
