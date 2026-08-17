import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { initialsOf, PersonaAvatar } from "@/components/shell/persona-avatar";

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("ออม สุชานาฏ")).toBe("อส");
    expect(initialsOf("John Smith")).toBe("JS");
  });

  it("takes the first two chars of a single word", () => {
    expect(initialsOf("jantana")).toBe("JA");
    expect(initialsOf("ออม")).toBe("ออ");
  });

  it("uses more than two words but still two initials", () => {
    expect(initialsOf("Somchai Prasert Wong")).toBe("SP");
  });

  it("returns ?? for empty/whitespace-only names", () => {
    expect(initialsOf("")).toBe("??");
    expect(initialsOf("   ")).toBe("??");
  });
});

describe("PersonaAvatar", () => {
  it("renders initials with an accessible name", () => {
    render(<PersonaAvatar name="ออม สุชานาฏ" />);
    const el = screen.getByLabelText("ออม สุชานาฏ");
    expect(el).toHaveTextContent("อส");
  });

  it("applies size classes for sm", () => {
    render(<PersonaAvatar name="John Smith" size="sm" />);
    expect(screen.getByLabelText("John Smith").className).toContain("size-[22px]");
  });

  it("defaults to md size", () => {
    render(<PersonaAvatar name="John Smith" />);
    expect(screen.getByLabelText("John Smith").className).toContain("size-[27px]");
  });
});
