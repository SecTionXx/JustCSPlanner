import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Field, PageHeader, Panel } from "@/app/(app)/_components/field";

describe("Field", () => {
  it("renders label and value", () => {
    render(<Field label="ลูกค้า" value="บริษัท ก" />);
    expect(screen.getByText("ลูกค้า")).toBeInTheDocument();
    expect(screen.getByText("บริษัท ก")).toBeInTheDocument();
  });

  it("renders children when value is absent", () => {
    render(<Field label="ผู้รับผิดชอบ">ออม</Field>);
    expect(screen.getByText("ออม")).toBeInTheDocument();
  });

  it("prefers value over children when both are set", () => {
    render(
      <Field label="L" value="จาก value">
        จาก children
      </Field>,
    );
    expect(screen.getByText("จาก value")).toBeInTheDocument();
    expect(screen.queryByText("จาก children")).toBeNull();
  });

  it("shows an em dash placeholder when empty", () => {
    render(<Field label="เที่ยวเรือ" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("renders title as h1 with optional subtitle", () => {
    render(<PageHeader title="แดชบอร์ด" subtitle="ภาพรวมวันนี้" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "แดชบอร์ด" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ภาพรวมวันนี้")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <PageHeader
        title="T"
        actions={<button type="button">สร้างงาน</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "สร้างงาน" })).toBeInTheDocument();
  });
});

describe("Panel", () => {
  it("renders children inside a section", () => {
    render(<Panel>เนื้อหา</Panel>);
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
    expect(screen.getByText("เนื้อหา")).toBeInTheDocument();
  });

  it("renders an optional header title and actions", () => {
    render(
      <Panel title="รายการงาน" actions={<span>3 งาน</span>}>
        เนื้อหา
      </Panel>,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "รายการงาน" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 งาน")).toBeInTheDocument();
  });

  it("omits the header entirely when no title and no actions", () => {
    render(<Panel>เนื้อหา</Panel>);
    expect(document.querySelector("header")).toBeNull();
  });
});
