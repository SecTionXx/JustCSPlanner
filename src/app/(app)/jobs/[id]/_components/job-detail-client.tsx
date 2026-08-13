"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TodoList } from "@/components/shell";
import { type JobStatus } from "@/lib/enums";
import type { Todo } from "@/lib/types";
import { cn } from "@/lib/utils";

import { toggleTodo, updateJobStatus } from "../../../actions";

export interface JobDetailClientProps {
  jobId: string;
  status: JobStatus;
  todos: Todo[];
  ownerName: string;
}

const STATUS_ACTIONS: { label: string; status: JobStatus; variant?: "default" | "outline"; confirm?: boolean }[] = [
  { label: "รับงาน", status: "In Progress" },
  { label: "เริ่มดำเนินการ", status: "In Progress" },
  { label: "รอลูกค้า", status: "Waiting Customer", variant: "outline" },
  { label: "รอเอกสาร", status: "Waiting Docs", variant: "outline" },
  { label: "Blocked", status: "Blocked", variant: "outline" },
  { label: "ปิดงาน", status: "Completed", variant: "outline", confirm: true },
];

export function JobDetailClient({
  jobId,
  status,
  todos,
  ownerName,
}: JobDetailClientProps): React.ReactElement {
  const todoItems = todos
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((t) => ({
      id: t.todoId,
      title: t.title,
      done: t.status === "Done",
    }));

  const handleToggle = (id: string): void => {
    const target = todos.find((t) => t.todoId === id);
    if (!target) return;
    const nextDone = target.status !== "Done";
    void toggleTodo(id, nextDone, jobId);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS.filter((a) => a.status !== status).map((action) => (
          <StatusActionButton
            key={`${action.label}-${action.status}`}
            action={action}
            jobId={jobId}
          />
        ))}
        <span className="ml-auto self-center text-[11px] text-muted-foreground">
          เจ้าของงาน: <strong className="text-foreground">{ownerName}</strong>
        </span>
      </div>

      <div className="mt-4">
        <TodoList items={todoItems} onToggle={handleToggle} />
      </div>
    </>
  );
}

function StatusActionButton({
  action,
  jobId,
}: {
  action: { label: string; status: JobStatus; variant?: "default" | "outline"; confirm?: boolean };
  jobId: string;
}): React.ReactElement {
  const [reason, setReason] = React.useState("");
  const [open, setOpen] = React.useState(false);

  if (action.confirm) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant={action.variant ?? "default"} className="h-8 rounded-[9px] text-xs font-bold">
              {action.label}
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการปิดงาน</DialogTitle>
            <DialogDescription>
              การปิดงานถือว่า Job Card นี้เสร็จสมบูรณ์ และจะบันทึกในประวัติกิจกรรม
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="หมายเหตุ (ไม่บังคับ)"
            className="min-h-[80px] w-full rounded-[9px] border bg-white px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 rounded-[9px]"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                void updateJobStatus(jobId, action.status, reason.trim() || undefined).then(() => setOpen(false));
              }}
              className="h-9 rounded-[9px] font-bold"
            >
              ยืนยันปิดงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      variant={action.variant ?? "default"}
      className={cn("h-8 rounded-[9px] text-xs font-bold")}
      onClick={() => void updateJobStatus(jobId, action.status)}
    >
      {action.label}
    </Button>
  );
}
