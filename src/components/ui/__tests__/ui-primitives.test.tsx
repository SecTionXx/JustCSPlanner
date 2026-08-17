import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/theme";

// Smoke tests for the shadcn-style primitives (thin @base-ui/react wrappers).
// They are intentionally excluded from coverage — we verify our wrappers
// compose and fire events, not Base UI internals.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

describe("Button", () => {
  it("renders every variant and fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { unmount } = render(
      <>
        <Button variant="default" onClick={onClick}>
          default
        </Button>
        <Button variant="outline">outline</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
      </>,
    );
    for (const name of [
      "default",
      "outline",
      "secondary",
      "ghost",
      "destructive",
      "link",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "default" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("supports size variants and disabled state", () => {
    render(
      <>
        <Button size="sm">sm</Button>
        <Button size="lg">lg</Button>
        <Button disabled>nope</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "nope" })).toBeDisabled();
  });
});

describe("Badge", () => {
  it("renders variants", () => {
    render(
      <>
        <Badge variant="default">d</Badge>
        <Badge variant="secondary">s</Badge>
        <Badge variant="destructive">x</Badge>
        <Badge variant="outline">o</Badge>
      </>,
    );
    for (const t of ["d", "s", "x", "o"]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });
});

describe("Card family", () => {
  it("composes header/title/description/action/content/footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>หัวข้อการ์ด</CardTitle>
          <CardDescription>คำอธิบาย</CardDescription>
          <CardAction>
            <span>action</span>
          </CardAction>
        </CardHeader>
        <CardContent>เนื้อหา</CardContent>
        <CardFooter>ท้ายการ์ด</CardFooter>
      </Card>,
    );
    expect(screen.getByText("หัวข้อการ์ด")).toBeInTheDocument();
    expect(screen.getByText("คำอธิบาย")).toBeInTheDocument();
    expect(screen.getByText("เนื้อหา")).toBeInTheDocument();
    expect(screen.getByText("ท้ายการ์ด")).toBeInTheDocument();
    expect(screen.getByText("action")).toBeInTheDocument();
  });
});

describe("form controls", () => {
  it("Input binds value", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="พิมพ์ที่นี่" />);
    const input = screen.getByPlaceholderText("พิมพ์ที่นี่");
    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
  });

  it("Textarea binds value", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="โน้ต" />);
    await user.type(screen.getByLabelText("โน้ต"), "ทดสอบ");
    expect(screen.getByLabelText("โน้ต")).toHaveValue("ทดสอบ");
  });

  it("Label links to its control via htmlFor", () => {
    render(
      <>
        <Label htmlFor="x">ชื่อ</Label>
        <Input id="x" />
      </>,
    );
    expect(screen.getByLabelText("ชื่อ")).toBeInTheDocument();
  });

  it("Checkbox toggles and fires onCheckedChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onCheckedChange={onChange} />);
    const box = screen.getByRole("checkbox");
    await user.click(box);
    expect(onChange).toHaveBeenCalled();
  });

  it("Separator renders", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).not.toBeNull();
  });
});

describe("overlays", () => {
  it("Dialog mounts its content in a portal on open", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger render={<Button>เปิด</Button>} />
        <DialogContent>เนื้อหาในไดอะล็อก</DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "เปิด" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("เนื้อหาในไดอะล็อก");
  });

  it("Select opens and reports the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select value="a" onValueChange={onValueChange}>
        <SelectTrigger aria-label="เลือก">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">ตัวเลือก เอ</SelectItem>
          <SelectItem value="b">ตัวเลือก บี</SelectItem>
        </SelectContent>
      </Select>,
    );
    await user.click(screen.getByRole("combobox", { name: "เลือก" }));
    // Options render in a portal once open. Base UI passes an event detail
    // object as the second onValueChange argument — assert on the value only.
    await user.click(await screen.findByText("ตัวเลือก บี"));
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[0][0]).toBe("b");
  });

  it("Tabs switch panels", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">แท็บหนึ่ง</TabsTrigger>
          <TabsTrigger value="two">แท็บสอง</TabsTrigger>
        </TabsList>
        <TabsContent value="one">เนื้อหาหนึ่ง</TabsContent>
        <TabsContent value="two">เนื้อหาสอง</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("เนื้อหาหนึ่ง")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "แท็บสอง" }));
    expect(screen.getByText("เนื้อหาสอง")).toBeInTheDocument();
  });

  it("Tooltip renders trigger and content structure", () => {
    render(
      <Tooltip>
        <TooltipTrigger render={<Button>hover me</Button>} />
        <TooltipContent>คำแนะนำ</TooltipContent>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "hover me" })).toBeInTheDocument();
  });

  it("ScrollArea renders children", () => {
    render(
      <ScrollArea>
        <p>เนื้อหายาว</p>
      </ScrollArea>,
    );
    expect(screen.getByText("เนื้อหายาว")).toBeInTheDocument();
  });
});
