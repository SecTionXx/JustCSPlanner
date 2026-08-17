import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OptionChips } from "@/components/shell/option-chips";

const OPTIONS = [
  { value: "fcl", label: "FCL" },
  { value: "lcl", label: "LCL" },
  { value: "air", label: "Air" },
];

describe("OptionChips — single mode (default)", () => {
  it("marks the selected chip via aria-pressed", () => {
    render(<OptionChips options={OPTIONS} value="lcl" />);
    expect(screen.getByRole("button", { name: "LCL" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "FCL" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("fires onChange with the clicked value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OptionChips options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Air" }));
    expect(onChange).toHaveBeenCalledWith("air");
  });

  it("reports only the newly clicked value (not a list)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OptionChips options={OPTIONS} value="fcl" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "LCL" }));
    expect(onChange).toHaveBeenCalledWith("lcl");
    expect(onChange).not.toHaveBeenCalledWith(["lcl"]);
  });

  it("does not call onChange when the prop is omitted", async () => {
    const user = userEvent.setup();
    render(<OptionChips options={OPTIONS} />);
    await user.click(screen.getByRole("button", { name: "FCL" }));
    expect(screen.getByRole("button", { name: "FCL" })).toBeInTheDocument();
  });
});

describe("OptionChips — multi mode", () => {
  it("marks every selected value", () => {
    render(<OptionChips options={OPTIONS} values={["fcl", "air"]} allowMultiple />);
    expect(screen.getByRole("button", { name: "FCL" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Air" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "LCL" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("adds a newly clicked value to the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OptionChips
        options={OPTIONS}
        values={["fcl"]}
        allowMultiple
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "LCL" }));
    expect(onChange).toHaveBeenCalledWith(["fcl", "lcl"]);
  });

  it("removes a clicked selected value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OptionChips
        options={OPTIONS}
        values={["fcl", "lcl"]}
        allowMultiple
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "FCL" }));
    expect(onChange).toHaveBeenCalledWith(["lcl"]);
  });
});
