"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import { PersonaAvatar } from "@/components/shell";
import type { TeamMember } from "@/lib/types";

import { editJob } from "../../actions";

export interface ReassignControlProps {
  jobId: string;
  currentOwnerCsId: string;
  currentOwnerName: string;
  team: TeamMember[];
  canReassign: boolean;
}

/**
 * Per-row reassign trigger. Opens a Dialog with a CS <select>, a required
 * reason <input>, and a live "old → new" summary. On confirm, calls the
 * existing `editJob` action (which enforces canReassign server-side and
 * requires a reason for owner changes) then `router.refresh()` to pull fresh
 * RSC data.
 */
export function ReassignControl({
  jobId,
  currentOwnerCsId,
  currentOwnerName,
  team,
  canReassign,
}: ReassignControlProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [newCsId, setNewCsId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const newMember = team.find((m) => m.csId === newCsId);
  const newOwnerName = newMember?.displayName ?? "";
  const canConfirm =
    newCsId !== "" &&
    newCsId !== currentOwnerCsId &&
    reason.trim() !== "" &&
    !pending;

  function reset(): void {
    setNewCsId("");
    setReason("");
    setError(null);
  }

  function handleConfirm(): void {
    if (!canConfirm) return;
    const trimmedReason = reason.trim();
    startTransition(() => {
      editJob(jobId, { owner: newCsId }, { reason: trimmedReason })
        .then(() => {
          setOpen(false);
          reset();
          router.refresh();
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        });
    });
  }

  if (!canReassign) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="rounded-[9px] text-xs font-bold"
      >
        เปลี่ยนเจ้าของ
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-[9px] text-xs font-bold"
          >
            เปลี่ยนเจ้าของ
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนเจ้าของงาน</DialogTitle>
          <DialogDescription>
            ระบุเจ้าของใหม่และเหตุผลในการเปลี่ยนแปลง (บันทึกในประวัติกิจกรรม)
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              เจ้าของใหม่
            </span>
            <select
              value={newCsId}
              onChange={(e) => {
                setNewCsId(e.target.value);
                setError(null);
              }}
              className="h-9 rounded-md border bg-card px-2 text-sm"
            >
              <option value="">— เลือก CS —</option>
              {team.map((m) => (
                <option key={m.csId} value={m.csId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              เหตุผล <span className="text-destructive">*</span>
            </span>
            <Input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="เช่น โอนงานเนื่องจาก workload เต็ม"
              className="h-9 text-sm"
            />
          </label>

          {newCsId !== "" && newCsId !== currentOwnerCsId ? (
            <div className="flex items-center gap-2 rounded-[10px] border border-primary/30 bg-secondary/60 p-2.5 text-[13px]">
              <PersonaAvatar name={currentOwnerName} size="sm" />
              <strong className="text-foreground">{currentOwnerName}</strong>
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
              <PersonaAvatar name={newOwnerName} size="sm" />
              <strong className="text-foreground">{newOwnerName}</strong>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 rounded-[9px]"
          >
            ยกเลิก
          </Button>
          <Button
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="h-9 rounded-[9px] font-bold"
          >
            ยืนยันการเปลี่ยนเจ้าของ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
