"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonaAvatar } from "@/components/shell";
import { type Role } from "@/lib/enums";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

import { createTeamMember, updateTeamMember } from "../../actions";

export interface TeamAdminClientProps {
  team: TeamMember[];
  canManage: boolean;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "requester", label: "ผู้ขอ (Requester)" },
  { value: "cs_owner", label: "CS Owner" },
  { value: "cs_assistant", label: "CS Assistant" },
  { value: "lead", label: "Lead" },
  { value: "admin", label: "Admin" },
];

const ROLE_LABEL: Record<Role, string> = {
  requester: "ผู้ขอ",
  cs_owner: "CS Owner",
  cs_assistant: "CS Assistant",
  lead: "Lead",
  admin: "Admin",
};

const SELECT_CLASS = "h-9 rounded-md border bg-white px-2.5 text-sm";

export function TeamAdminClient({
  team,
  canManage,
}: TeamAdminClientProps): React.ReactElement {
  const rows = team
    .slice()
    .sort((a, b) => Number(b.active) - Number(a.active) || a.csId.localeCompare(b.csId));

  return (
    <div className="flex flex-col gap-4">
      {canManage ? <AddMemberForm /> : null}

      <div className="overflow-hidden rounded-[14px] border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"
             
            >
              <th className="px-3 py-2 font-semibold">สมาชิก</th>
              <th className="px-3 py-2 font-semibold">csId</th>
              <th className="px-3 py-2 font-semibold">บทบาท</th>
              <th className="px-3 py-2 font-semibold">อีเมล</th>
              <th className="px-3 py-2 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <MemberRow key={m.csId} member={m} canManage={canManage} />
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  ยังไม่มีสมาชิกในทีม
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddMemberForm(): React.ReactElement {
  const [displayName, setDisplayName] = React.useState("");
  const [role, setRole] = React.useState<Role>("cs_owner");
  const [email, setEmail] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const canSubmit = displayName.trim() !== "" && !pending;

  function handleSubmit(): void {
    if (!canSubmit) return;
    const payload = {
      displayName: displayName.trim(),
      role,
      email: email.trim() || undefined,
    };
    startTransition(() => {
      createTeamMember(payload)
        .then(() => {
          setDisplayName("");
          setEmail("");
          setRole("cs_owner");
        })
        .catch(() => {
          // leave inputs so the user can retry
        });
    });
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-[14px] border bg-card p-3"
     
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="new-displayName" className="text-xs font-bold">
          ชื่อแสดง <span className="text-destructive">*</span>
        </label>
        <Input
          id="new-displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="เช่น อ้อม"
          className="h-9 w-[180px] text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="new-role" className="text-xs font-bold">
          บทบาท
        </label>
        <select
          id="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className={SELECT_CLASS}
         
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="new-email" className="text-xs font-bold">
          อีเมล
        </label>
        <Input
          id="new-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="name@example.com"
          className="h-9 w-[220px] text-sm"
        />
      </div>
      <Button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="h-9 rounded-[9px] font-bold"
      >
        เพิ่มสมาชิก
      </Button>
      <p className="w-full text-[11px] text-muted-foreground">
        csId จะถูกสร้างอัตโนมัติจากชื่อ (ถ้าชื่อเป็นภาษาไทยจะใช้รหัส member-NN)
      </p>
    </div>
  );
}

function MemberRow({
  member,
  canManage,
}: {
  member: TeamMember;
  canManage: boolean;
}): React.ReactElement {
  const [displayName, setDisplayName] = React.useState(member.displayName);
  const [role, setRole] = React.useState<Role>(member.role);
  const [email, setEmail] = React.useState(member.email ?? "");
  const [active, setActive] = React.useState(member.active);
  const [editing, setEditing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleSave(): void {
    startTransition(() => {
      updateTeamMember(member.csId, {
        displayName: displayName.trim(),
        role,
        email: email.trim() || undefined,
        active,
      })
        .then(() => setEditing(false))
        .catch(() => {
          // stay in edit mode on failure
        });
    });
  }

  function handleCancel(): void {
    setDisplayName(member.displayName);
    setRole(member.role);
    setEmail(member.email ?? "");
    setActive(member.active);
    setEditing(false);
  }

  if (!editing || !canManage) {
    return (
      <tr className="border-b last:border-b-0">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <PersonaAvatar name={member.displayName} size="sm" />
            <strong className="text-sm font-bold text-foreground">
              {member.displayName}
            </strong>
          </div>
        </td>
        <td className="px-3 py-2">
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{member.csId}</code>
        </td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
            {ROLE_LABEL[member.role]}
          </span>
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {member.email ?? "—"}
        </td>
        <td className="px-3 py-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              member.active
                ? "bg-status-completed-soft text-status-completed"
                : "bg-status-blocked-soft text-destructive",
            )}
          >
            {member.active ? "ใช้งาน" : "ปิดใช้งาน"}
          </span>
        </td>
        {canManage ? (
          <td className="px-3 py-2 text-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="rounded-[9px] text-xs font-bold"
            >
              แก้ไข
            </Button>
          </td>
        ) : null}
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-2">
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-8 w-[150px] text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{member.csId}</code>
      </td>
      <td className="px-3 py-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="h-8 rounded-md border bg-white px-2 text-sm"
         
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 w-[200px] text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <label className="inline-flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4"
          />
          {active ? "ใช้งาน" : "ปิดใช้งาน"}
        </label>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1.5">
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
            disabled={pending || displayName.trim() === ""}
            className="rounded-[9px] text-xs font-bold"
          >
            บันทึก
          </Button>
        </div>
      </td>
    </tr>
  );
}
