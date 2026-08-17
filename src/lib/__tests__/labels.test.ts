import { describe, expect, it } from "vitest";

import {
  ACTIVITY_EVENTS,
  EMAIL_INBOX_STATUSES,
  JOB_STATUSES,
  PRIORITIES,
  TODO_STATUSES,
} from "@/lib/enums";
import {
  ACTIVITY_EVENT_TH,
  ACTIVITY_EVENT_TONE,
  EMAIL_STATUS_TH,
  JOB_STATUS_CLASSES,
  JOB_STATUS_TH,
  PRIORITY_CLASSES,
  PRIORITY_TH,
  TODO_STATUS_CLASSES,
  TODO_STATUS_TH,
  toJobStatus,
} from "@/lib/labels";

describe("toJobStatus", () => {
  it("maps each canonical status to itself", () => {
    for (const status of JOB_STATUSES) {
      expect(toJobStatus(status)).toBe(status);
    }
  });

  it("matches Thai aliases", () => {
    expect(toJobStatus("รอลูกค้า")).toBe("Waiting Customer");
    expect(toJobStatus("รอเอกสาร")).toBe("Waiting Docs");
    expect(toJobStatus("ติดขัด")).toBe("Blocked");
    expect(toJobStatus("ต้องการช่วยเหลือ")).toBe("Needs Help");
    expect(toJobStatus("เสร็จสิ้น")).toBe("Completed");
    expect(toJobStatus("กำลังดำเนินการ")).toBe("In Progress");
    expect(toJobStatus("ใหม่")).toBe("New");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(toJobStatus("  IN PROGRESS ")).toBe("In Progress");
  });

  it("falls back to New for unknown strings", () => {
    expect(toJobStatus("สถานะแปลก ๆ")).toBe("New");
    expect(toJobStatus("whatever")).toBe("New");
  });

  it("honors a custom fallback", () => {
    expect(toJobStatus("whatever", "Blocked")).toBe("Blocked");
  });
});

describe("label/class map completeness", () => {
  it("has a Thai label for every job status", () => {
    for (const s of JOB_STATUSES) expect(JOB_STATUS_TH[s]).toBeTruthy();
  });

  it("has classes for every job status", () => {
    for (const s of JOB_STATUSES) expect(JOB_STATUS_CLASSES[s]).toBeTruthy();
  });

  it("has a Thai label and classes for every priority", () => {
    for (const p of PRIORITIES) {
      expect(PRIORITY_TH[p]).toBeTruthy();
      expect(PRIORITY_CLASSES[p]).toBeTruthy();
    }
  });

  it("has a Thai label and classes for every todo status", () => {
    for (const s of TODO_STATUSES) {
      expect(TODO_STATUS_TH[s]).toBeTruthy();
      expect(TODO_STATUS_CLASSES[s]).toBeTruthy();
    }
  });

  it("has a Thai label and tone for every activity event", () => {
    for (const e of ACTIVITY_EVENTS) {
      expect(ACTIVITY_EVENT_TH[e]).toBeTruthy();
      expect(ACTIVITY_EVENT_TONE[e]).toBeTruthy();
    }
  });

  it("has a Thai label for every email status", () => {
    for (const s of EMAIL_INBOX_STATUSES) {
      expect(EMAIL_STATUS_TH[s]).toBeTruthy();
    }
  });
});
