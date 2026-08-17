import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TodoList } from "@/components/shell/todo-list";

const ITEMS = [
  { id: "t1", title: "จองตู้ตัวแม่ขนส่ง", done: false },
  { id: "t2", title: "เตรียมใบขนสินค้า", done: true },
];

describe("TodoList", () => {
  it("renders items in order", () => {
    render(<TodoList items={ITEMS} />);
    const titles = ITEMS.map((i) => screen.getByText(i.title));
    expect(titles).toHaveLength(2);
  });

  it("strikes through done items", () => {
    render(<TodoList items={ITEMS} />);
    expect(screen.getByText("เตรียมใบขนสินค้า").className).toContain(
      "line-through",
    );
    expect(screen.getByText("จองตู้ตัวแม่ขนส่ง").className).not.toContain(
      "line-through",
    );
  });

  it("fires onToggle with the item id when a checkbox changes", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoList items={ITEMS} onToggle={onToggle} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith("t1");
  });

  it("renders the add slot via children", () => {
    render(
      <TodoList items={ITEMS}>
        <button type="button">+ เพิ่ม To-do</button>
      </TodoList>,
    );
    expect(
      screen.getByRole("button", { name: "+ เพิ่ม To-do" }),
    ).toBeInTheDocument();
  });

  it("does not crash when onToggle is omitted", async () => {
    const user = userEvent.setup();
    render(<TodoList items={ITEMS} />);
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});
