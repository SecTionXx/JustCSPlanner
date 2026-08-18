import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/theme";
import { themeState } from "@/test/theme";
import { ThemeToggle } from "@/components/shell/theme-toggle";

beforeEach(() => {
  themeState.resolvedTheme = "light";
  themeState.setTheme.mockClear();
});

describe("ThemeToggle", () => {
  it("offers switching to dark mode in light theme", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "เปลี่ยนเป็นโหมดมืด" }),
    ).toBeInTheDocument();
  });

  it("clicking switches to dark", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(
      screen.getByRole("button", { name: "เปลี่ยนเป็นโหมดมืด" }),
    );
    expect(themeState.setTheme).toHaveBeenCalledWith("dark");
  });

  it("offers switching to light mode in dark theme", async () => {
    const user = userEvent.setup();
    themeState.resolvedTheme = "dark";
    render(<ThemeToggle />);
    await user.click(
      screen.getByRole("button", { name: "เปลี่ยนเป็นโหมดสว่าง" }),
    );
    expect(themeState.setTheme).toHaveBeenCalledWith("light");
  });
});
