import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppError from "@/app/(app)/error";

function makeError(digest?: string) {
  const err = new Error("boom") as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("AppError", () => {
  it("renders the Thai error heading and copy", () => {
    render(<AppError error={makeError()} reset={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "เกิดข้อผิดพลาด" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ระบบไม่สามารถดำเนินการต่อได้/),
    ).toBeInTheDocument();
  });

  it("shows the digest reference when present", () => {
    render(<AppError error={makeError("abc123")} reset={vi.fn()} />);
    expect(screen.getByText(/รหัสอ้างอิง: abc123/)).toBeInTheDocument();
  });

  it("hides the digest line when absent", () => {
    render(<AppError error={makeError()} reset={vi.fn()} />);
    expect(screen.queryByText(/รหัสอ้างอิง/)).toBeNull();
  });

  it("ลองอีกครั้ง calls reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AppError error={makeError()} reset={reset} />);
    await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("กลับหน้าหลัก links to /", () => {
    render(<AppError error={makeError()} reset={vi.fn()} />);
    // Base UI Button with render={<Link/>} keeps role="button" on the <a>.
    const home = screen.getByRole("button", { name: "กลับหน้าหลัก" });
    expect(home.tagName).toBe("A");
    expect(home).toHaveAttribute("href", "/");
  });
});
