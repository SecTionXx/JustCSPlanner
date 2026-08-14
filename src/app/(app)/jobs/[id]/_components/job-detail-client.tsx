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
import { Input } from "@/components/ui/input";
import { TodoList } from "@/components/shell";
import { type JobStatus } from "@/lib/enums";
import type { TeamMember, Todo } from "@/lib/types";
import { cn } from "@/lib/utils";

import { addTodo, deleteTodoAction, toggleTodo, updateJobStatus } from "../../../actions";

export interface JobDetailClientProps {
  jobId: string;
  status: JobStatus;
  todos: Todo[];
  ownerName: string;
  team: TeamMember[];
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
  team,
}: JobDetailClientProps): React.ReactElement {
  const todoItems = todos
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((t) => ({
      id: t.todoId,
      title: (
        <span className="inline-flex flex-1 items-center justify-between gap-2">
          <span>{t.title}</span>
          <TodoDeleteButton todoId={t.todoId} jobId={jobId} />
        </span>
      ),
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
        <TodoList items={todoItems} onToggle={handleToggle}>
          <AddTodoComposer jobId={jobId} team={team} />
        </TodoList>
      </div>
    </>
  );
}

function AddTodoComposer({
  jobId,
  team,
}: {
  jobId: string;
  team: TeamMember[];
}): React.ReactElement {
  const [title, setTitle] = React.useState("");
  const [assignee, setAssignee] = React.useState(team[0]?.csId ?? "");
  const [pending, startTransition] = React.useTransition();

  const canSubmit = title.trim() !== "" && assignee !== "" && !pending;

  function handleAdd(): void {
    if (!canSubmit) return;
    const trimmed = title.trim();
    startTransition(() => {
      addTodo(jobId, trimmed, assignee)
        .then(() => {
          setTitle("");
        })
        .catch(() => {
          // keep input on failure so the user can retry
        });
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#f0eef5] pt-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="+ เพิ่ม To-do..."
        className="h-8 min-w-[160px] flex-1 text-[13px]"
      />
      <select
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        className="h-8 rounded-md border bg-white px-2 text-[13px]"
        style={{ borderColor: "var(--border)" }}
        aria-label="มอบหมายให้"
      >
        {team.map((m) => (
          <option key={m.csId} value={m.csId}>
            {m.displayName}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        disabled={!canSubmit}
        onClick={handleAdd}
        className="rounded-[9px] text-xs font-bold"
      >
        เพิ่ม
      </Button>
    </div>
  );
}

function TodoDeleteButton({
  todoId,
  jobId,
}: {
  todoId: string;
  jobId: string;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="ลบ To-do"
            className="ml-1 inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[13px] leading-none text-muted-foreground transition-colors hover:bg-[#fbe7eb] hover:text-[#c43850]"
          >
            ×
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ลบ To-do</DialogTitle>
          <DialogDescription>
            ยืนยันการลบ To-do นี้? ไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 rounded-[9px]"
          >
            ยกเลิก
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(() => {
                deleteTodoAction(todoId, jobId)
                  .then(() => setOpen(false))
                  .catch(() => {
                    // leave open on failure
                  });
              });
            }}
            className="h-9 rounded-[9px] font-bold"
          >
            ลบ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
