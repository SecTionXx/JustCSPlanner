"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceType } from "@/lib/enums";
import type { Template } from "@/lib/types";

import { createTemplate, deleteTemplate, updateTemplate } from "../../actions";

export interface TemplateGroup {
  type: ServiceType;
  label: string;
  rows: Template[];
}

export interface TemplatesAdminClientProps {
  groups: TemplateGroup[];
  canManage: boolean;
}

export function TemplatesAdminClient({
  groups,
  canManage,
}: TemplatesAdminClientProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <TemplateGroupTable key={group.type} group={group} canManage={canManage} />
      ))}
    </div>
  );
}

function TemplateGroupTable({
  group,
  canManage,
}: {
  group: TemplateGroup;
  canManage: boolean;
}): React.ReactElement {
  return (
    <section
      className="overflow-hidden rounded-[14px] border bg-card"
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
       
      >
        <h2 className="text-sm font-bold text-foreground">{group.label}</h2>
        <span className="text-[11px] text-muted-foreground">
          {group.rows.length} รายการ
        </span>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"
           
          >
            <th className="w-[56px] px-3 py-2 font-semibold">ลำดับ</th>
            <th className="px-3 py-2 font-semibold">ชื่อ To-do</th>
            <th className="w-[140px] px-3 py-2 font-semibold">ก่อน Deadline (ชม.)</th>
            <th className="px-3 py-2 font-semibold">หมายเหตุ</th>
            {canManage ? <th className="w-[80px] px-3 py-2" /> : null}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((t) => (
            <TemplateRow
              key={`${t.templateType}-${t.order}`}
              template={t}
              canManage={canManage}
            />
          ))}
          {group.rows.length === 0 ? (
            <tr>
              <td
                colSpan={canManage ? 5 : 4}
                className="px-3 py-5 text-center text-muted-foreground"
              >
                ยังไม่มีเทมเพลตสำหรับประเภทนี้
              </td>
            </tr>
          ) : null}
          {canManage ? (
            <AddTemplateRow type={group.type} nextOrder={group.rows.length + 1} />
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

function TemplateRow({
  template,
  canManage,
}: {
  template: Template;
  canManage: boolean;
}): React.ReactElement {
  const [todoTitle, setTodoTitle] = React.useState(template.todoTitle);
  const [offset, setOffset] = React.useState(String(template.deadlineOffsetHours));
  const [notes, setNotes] = React.useState(template.notes ?? "");
  const [editing, setEditing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const offsetNum = Number(offset);
  const canSave =
    todoTitle.trim() !== "" &&
    Number.isFinite(offsetNum) &&
    offsetNum >= 0 &&
    !pending;

  function handleSave(): void {
    if (!canSave) return;
    startTransition(() => {
      updateTemplate(
        template.templateType,
        template.order,
        {
          todoTitle: todoTitle.trim(),
          deadlineOffsetHours: offsetNum,
          notes: notes.trim() || undefined,
        },
      )
        .then(() => setEditing(false))
        .catch(() => {
          // stay in edit mode on failure
        });
    });
  }

  function handleCancel(): void {
    setTodoTitle(template.todoTitle);
    setOffset(String(template.deadlineOffsetHours));
    setNotes(template.notes ?? "");
    setEditing(false);
  }

  function handleDelete(): void {
    startTransition(() => {
      deleteTemplate(template.templateType, template.order).catch(() => {
        // ignore — table re-renders from revalidate
      });
    });
  }

  if (!editing || !canManage) {
    return (
      <tr className="border-b last:border-b-0">
        <td className="px-3 py-2 text-muted-foreground">{template.order}</td>
        <td className="px-3 py-2 font-medium text-foreground">{template.todoTitle}</td>
        <td className="px-3 py-2 text-muted-foreground">{template.deadlineOffsetHours}</td>
        <td className="px-3 py-2 text-muted-foreground">{template.notes ?? "—"}</td>
        {canManage ? (
          <td className="px-3 py-2 text-right">
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-[9px] text-xs font-bold"
              >
                แก้ไข
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-[9px] text-xs font-bold"
              >
                ลบ
              </Button>
            </div>
          </td>
        ) : null}
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-2 text-muted-foreground">{template.order}</td>
      <td className="px-3 py-2">
        <Input
          value={todoTitle}
          onChange={(e) => setTodoTitle(e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          className="h-8 w-[120px] text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          className="min-h-[32px] text-sm"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={pending}
            className="rounded-[9px] text-xs font-bold"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-[9px] text-xs font-bold"
          >
            บันทึก
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AddTemplateRow({
  type,
  nextOrder,
}: {
  type: ServiceType;
  nextOrder: number;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [todoTitle, setTodoTitle] = React.useState("");
  const [offset, setOffset] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const offsetNum = Number(offset);
  const canSubmit =
    todoTitle.trim() !== "" &&
    Number.isFinite(offsetNum) &&
    offsetNum >= 0 &&
    !pending;

  function reset(): void {
    setTodoTitle("");
    setOffset("0");
    setNotes("");
  }

  function handleAdd(): void {
    if (!canSubmit) return;
    startTransition(() => {
      createTemplate({
        templateType: type,
        order: nextOrder,
        todoTitle: todoTitle.trim(),
        deadlineOffsetHours: offsetNum,
        notes: notes.trim() || undefined,
      })
        .then(() => {
          reset();
          setOpen(false);
        })
        .catch(() => {
          // leave inputs on failure
        });
    });
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={5} className="px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className="text-xs font-bold text-muted-foreground"
          >
            + เพิ่ม To-do ในกลุ่มนี้
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="px-3 py-2 text-muted-foreground">{nextOrder}</td>
      <td className="px-3 py-2">
        <Input
          value={todoTitle}
          onChange={(e) => setTodoTitle(e.target.value)}
          placeholder="เช่น ตรวจ Booking Confirmation"
          className="h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          className="h-8 w-[120px] text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          placeholder="หมายเหตุ (ไม่บังคับ)"
          className="min-h-[32px] text-sm"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            disabled={pending}
            className="rounded-[9px] text-xs font-bold"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!canSubmit}
            className="rounded-[9px] text-xs font-bold"
          >
            เพิ่ม
          </Button>
        </div>
      </td>
    </tr>
  );
}
