import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Notice } from "@/components/shell/notice";

describe("Notice", () => {
  it("renders children", () => {
    render(<Notice>ข้อความแจ้งเตือน</Notice>);
    expect(screen.getByText("ข้อความแจ้งเตือน")).toBeInTheDocument();
  });

  it("renders an optional bold title prefix", () => {
    render(<Notice title="หมายเหตุ">เนื้อหา</Notice>);
    const title = screen.getByText("หมายเหตุ:");
    expect(title.tagName).toBe("STRONG");
  });

  it("has no title node when title is omitted", () => {
    render(<Notice>เนื้อหา</Notice>);
    expect(document.querySelector("strong")).toBeNull();
  });

  it("uses the amber notice palette", () => {
    render(<Notice>ข้อความ</Notice>);
    expect(screen.getByText("ข้อความ").closest("div")?.className).toContain(
      "bg-notice-bg",
    );
  });
});
