"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { addEmail } from "../actions";

const FORM_FIELD = "flex flex-col gap-1.5";
const INPUT_CLASS = "h-9 text-sm";

/**
 * "เพิ่มอีเมล (วางข้อความ)" form — pastes an inbound email into the staging
 * area via the addEmail server action (source: "paste"). Resets on success;
 * surfaces the action's error message inline.
 */
export function AddEmailForm(): React.ReactElement {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        setError(null);
        await addEmail(data);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "บันทึกอีเมลไม่สำเร็จ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className={cn(FORM_FIELD, "sm:col-span-2")}>
        <Label htmlFor="fromAddress" className="text-xs font-bold">
          จาก (อีเมลผู้ส่ง) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fromAddress"
          name="fromAddress"
          type="email"
          required
          placeholder="customer@company.co.th"
          className={INPUT_CLASS}
        />
      </div>

      <div className={FORM_FIELD}>
        <Label htmlFor="subject" className="text-xs font-bold">
          หัวเรื่อง <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          required
          placeholder="เช่น Re: Booking BK-12345 — ส่ง SI แล้ว"
          className={INPUT_CLASS}
        />
      </div>

      <div className={FORM_FIELD}>
        <Label htmlFor="body" className="text-xs font-bold">
          เนื้อความ
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          placeholder="วางข้อความอีเมลทั้งหมดที่นี่..."
          className="text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-9 rounded-[9px] px-4 text-sm font-bold"
        >
          {pending ? "กำลังบันทึก…" : "บันทึกเข้ากล่องรับ"}
        </Button>
        {error ? (
          <span className="text-xs font-semibold text-destructive">{error}</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            บันทึกแล้วระบบจะแนะนำงานที่ตรงกับเลข booking หรือชื่อลูกค้า
          </span>
        )}
      </div>
    </form>
  );
}
