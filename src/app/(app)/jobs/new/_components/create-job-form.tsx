"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Notice,
  OptionChips,
  StepPills,
} from "@/components/shell";
import {
  JOB_STATUSES,
  PRIORITIES,
  SERVICE_TYPES,
  SHIPMENT_TYPES,
  type JobStatus,
  type Priority,
  type ServiceType,
  type ShipmentType,
} from "@/lib/enums";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

import { createJob } from "../../../actions";

export interface CreateJobFormProps {
  team: TeamMember[];
}

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = JOB_STATUSES
  .filter((s) => s === "New" || s === "In Progress" || s === "Completed")
  .map((s) => ({ value: s, label: s }));

const SHIPMENT_OPTIONS: { value: ShipmentType; label: string }[] = SHIPMENT_TYPES.map(
  (s) => ({ value: s, label: s }),
);

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = PRIORITIES.map((p) => ({
  value: p,
  label: p,
}));

const FORM_FIELD =
  "flex flex-col gap-1.5";

const INPUT_CLASS = "h-9 text-sm";

export function CreateJobForm({ team }: CreateJobFormProps): React.ReactElement {
  const [shipmentType, setShipmentType] = React.useState<ShipmentType>("FCL");
  const [serviceType] = React.useState<ServiceType>("Export Sea");
  const [status, setStatus] = React.useState<JobStatus>("New");
  const [priority, setPriority] = React.useState<Priority>("Normal");

  const activeTeam = team.filter((m) => m.active);

  return (
    <form action={createJob} className="flex flex-col gap-4">
      <StepPills
        steps={["ข้อมูลงาน", "มอบหมาย", "สรุป"]}
        current={2}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="title" className="text-xs font-bold">
            ชื่องาน / Title <span className="text-[#c43850]">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="เช่น Export FCL → Singapore (รอ SI)"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="customer" className="text-xs font-bold">
            ลูกค้า <span className="text-[#c43850]">*</span>
          </Label>
          <Input
            id="customer"
            name="customer"
            required
            placeholder="ชื่อบริษัทลูกค้า"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="owner" className="text-xs font-bold">
            Assign ให้ <span className="text-[#c43850]">*</span>
          </Label>
          <select
            id="owner"
            name="owner"
            required
            defaultValue=""
            className={cn(
              INPUT_CLASS,
              "rounded-md border bg-white px-2.5",
            )}
            style={{ borderColor: "var(--border)" }}
          >
            <option value="" disabled>
              เลือก CS...
            </option>
            {activeTeam.map((m) => (
              <option key={m.csId} value={m.csId}>
                {m.displayName} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="deadline" className="text-xs font-bold">
            Deadline <span className="text-[#c43850]">*</span>
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            required
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">สถานะ</Label>
          <OptionChips
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as JobStatus)}
          />
          <input type="hidden" name="status" value={status} />
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">Shipment Type</Label>
          <OptionChips
            options={SHIPMENT_OPTIONS}
            value={shipmentType}
            onChange={(v) => setShipmentType(v as ShipmentType)}
          />
          <input type="hidden" name="shipmentType" value={shipmentType} />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="serviceType" className="text-xs font-bold">
            Service Type
          </Label>
          <select
            id="serviceType"
            name="serviceType"
            defaultValue={serviceType}
            className={cn(
              INPUT_CLASS,
              "rounded-md border bg-white px-2.5",
            )}
            style={{ borderColor: "var(--border)" }}
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={FORM_FIELD}>
          <Label className="text-xs font-bold">Priority</Label>
          <OptionChips
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(v) => setPriority(v as Priority)}
          />
          <input type="hidden" name="priority" value={priority} />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="bookingNumber" className="text-xs font-bold">
            Booking No.
          </Label>
          <Input
            id="bookingNumber"
            name="bookingNumber"
            placeholder="BK-xxxxx"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="route" className="text-xs font-bold">
            Route
          </Label>
          <Input
            id="route"
            name="route"
            placeholder="Bangkok → Singapore"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="carrier" className="text-xs font-bold">
            Carrier
          </Label>
          <Input
            id="carrier"
            name="carrier"
            placeholder="ONE / Maersk / EVA..."
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="etd" className="text-xs font-bold">
            ETD
          </Label>
          <Input
            id="etd"
            name="etd"
            type="datetime-local"
            className={INPUT_CLASS}
          />
        </div>

        <div className={FORM_FIELD}>
          <Label htmlFor="eta" className="text-xs font-bold">
            ETA
          </Label>
          <Input
            id="eta"
            name="eta"
            type="datetime-local"
            className={INPUT_CLASS}
          />
        </div>

        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="docLinks" className="text-xs font-bold">
            ลิงก์เอกสาร (ใส่บรรทัดละลิงก์)
          </Label>
          <Textarea
            id="docLinks"
            name="docLinks"
            placeholder={"https://drive.google.com/...\nhttps://..."}
            className="min-h-[60px] text-sm"
          />
        </div>

        <div className={cn(FORM_FIELD, "sm:col-span-2")}>
          <Label htmlFor="note" className="text-xs font-bold">
            Note / หมายเหตุเริ่มต้น
          </Label>
          <Textarea
            id="note"
            name="note"
            placeholder="ข้อมูลเพิ่มเติมสำหรับ CS ที่รับงาน"
            className="min-h-[70px] text-sm"
          />
        </div>
      </div>

      <Notice title="อัตโนมัติ">
        เมื่อบันทึก ระบบจะสร้าง Job Card พร้อม To-do (ตามเทมเพลตของ Service Type)
        และแจ้ง CS ที่ได้รับมอบหมายอัตโนมัติ
      </Notice>

      <div className="flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Button render={<Link href="/jobs" />} variant="outline" className="h-9 rounded-[9px] font-bold">
          ยกเลิก
        </Button>
        <Button type="submit" className="h-9 rounded-[9px] px-4 font-bold">
          สร้างงานและแจ้ง CS
        </Button>
      </div>
    </form>
  );
}
