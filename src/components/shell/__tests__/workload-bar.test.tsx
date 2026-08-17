import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  WorkloadBar,
  WorkloadLegend,
  type WorkloadSegment,
} from "@/components/shell/workload-bar";

function renderBar(segments: WorkloadSegment[]) {
  render(<WorkloadBar segments={segments} />);
  const bar = screen.getByRole("img", { name: /workload distribution/i });
  const spans = Array.from(
    bar.querySelectorAll("span"),
  ) as Array<HTMLElement>;
  return { bar, spans };
}

describe("WorkloadBar", () => {
  it("normalizes a single segment to 100% width", () => {
    const { spans } = renderBar([{ key: "done", value: 7 }]);
    expect(spans).toHaveLength(1);
    expect(spans[0].style.width).toBe("100%");
  });

  it("splits two equal segments at 50% each", () => {
    const { spans } = renderBar([
      { key: "new", value: 3 },
      { key: "done", value: 3 },
    ]);
    expect(spans.map((s) => s.style.width)).toEqual(["50%", "50%"]);
  });

  it("weights segments proportionally to their values", () => {
    const { spans } = renderBar([
      { key: "new", value: 1 },
      { key: "in_progress", value: 3 },
    ]);
    expect(spans.map((s) => s.style.width)).toEqual(["25%", "75%"]);
  });

  it("filters out zero-value segments", () => {
    const { spans } = renderBar([
      { key: "new", value: 0 },
      { key: "done", value: 4 },
    ]);
    expect(spans).toHaveLength(1);
    expect(spans[0].style.width).toBe("100%");
  });

  it("renders no segments (and no NaN widths) when the total is 0", () => {
    const { spans } = renderBar([
      { key: "new", value: 0 },
      { key: "done", value: 0 },
    ]);
    expect(spans).toHaveLength(0);
  });
});

describe("WorkloadLegend", () => {
  it("shows all default keys with Thai labels", () => {
    render(<WorkloadLegend />);
    for (const label of ["ใหม่", "กำลังดำเนินการ", "เสร็จแล้ว", "เกินกำหนด"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("limits the legend to the provided keys", () => {
    render(<WorkloadLegend keys={["overdue"]} />);
    expect(screen.getByText("เกินกำหนด")).toBeInTheDocument();
    expect(screen.queryByText("ใหม่")).not.toBeInTheDocument();
  });
});
