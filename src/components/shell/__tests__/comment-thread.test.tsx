import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CommentThread } from "@/components/shell/comment-thread";

const comments = [
  { id: "c1", author: "ออม", time: "17 ส.ค. 09:00", body: "รอลูกค้าส่งใบขน" },
  { id: "c2", author: "jantana", time: "17 ส.ค. 10:30", body: "ติดตามแล้ว" },
];

describe("CommentThread", () => {
  it("renders author, time, and body per comment", () => {
    render(<CommentThread comments={comments} />);
    expect(screen.getByText(/ออม · 17 ส.ค. 09:00/)).toBeInTheDocument();
    expect(screen.getByText(/jantana · 17 ส.ค. 10:30/)).toBeInTheDocument();
    expect(screen.getByText("รอลูกค้าส่งใบขน")).toBeInTheDocument();
    expect(screen.getByText("ติดตามแล้ว")).toBeInTheDocument();
  });

  it("renders the default add-comment button label", () => {
    render(<CommentThread comments={[]} />);
    expect(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ })).toBeInTheDocument();
  });

  it("supports a custom add label", () => {
    render(<CommentThread comments={[]} addLabel="เพิ่มโน้ต" />);
    expect(screen.getByRole("button", { name: /เพิ่มโน้ต/ })).toBeInTheDocument();
  });

  it("fires onAdd when the button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<CommentThread comments={[]} onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("does not crash when onAdd is omitted", async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={[]} />);
    await user.click(screen.getByRole("button", { name: /เพิ่มคอมเมนต์/ }));
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
