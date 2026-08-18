import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FileChips } from "@/components/shell/file-chips";

describe("FileChips", () => {
  it("renders one chip per file", () => {
    render(
      <FileChips
        files={[
          { name: "invoice.pdf" },
          { name: "bl-scan.png", url: "https://drive.example/bl" },
        ]}
      />,
    );
    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    expect(screen.getByText("bl-scan.png")).toBeInTheDocument();
  });

  it("renders a link when the file has a url", () => {
    render(<FileChips files={[{ name: "bl.png", url: "https://x/y" }]} />);
    const link = screen.getByRole("link", { name: /bl\.png/ });
    expect(link).toHaveAttribute("href", "https://x/y");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders a span (not a link) when no url", () => {
    render(<FileChips files={[{ name: "local.docx" }]} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("local.docx").tagName).toBe("SPAN");
  });

  it("renders a span (not a link) for non-http schemes", () => {
    render(
      <FileChips
        files={[
          { name: "evil.pdf", url: "javascript:alert(1)" },
          { name: "data.txt", url: "data:text/html,hi" },
        ]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("evil.pdf").tagName).toBe("SPAN");
    expect(screen.getByText("data.txt").tagName).toBe("SPAN");
  });

  it("still links site-relative urls", () => {
    render(
      <FileChips files={[{ name: "internal.pdf", url: "/files/internal.pdf" }]} />,
    );
    const link = screen.getByRole("link", { name: /internal\.pdf/ });
    expect(link).toHaveAttribute("href", "/files/internal.pdf");
  });

  it("shows the default upload pill", () => {
    render(<FileChips files={[]} />);
    expect(screen.getByText("+ อัปโหลดไฟล์")).toBeInTheDocument();
  });

  it("supports a custom upload label and hides the pill on demand", () => {
    const { unmount } = render(
      <FileChips files={[]} uploadLabel="แนบไฟล์เพิ่ม" />,
    );
    expect(screen.getByText("แนบไฟล์เพิ่ม")).toBeInTheDocument();
    unmount();

    render(<FileChips files={[]} showUploadPill={false} />);
    expect(screen.queryByText("+ อัปโหลดไฟล์")).not.toBeInTheDocument();
  });
});
