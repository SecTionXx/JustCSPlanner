import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JobCard } from "@/lib/types";
import {
  cn,
  daysUntil,
  formatDateTime,
  isNearDeadline,
  isOverdue,
  nextJobId,
  nowIso,
} from "@/lib/utils";

const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

// Freeze time so Bangkok wall-clock assertions are exact.
const NOW = new Date("2026-08-17T10:00:00Z"); // 17:00 Bangkok

function jobWith(deadline: string, status: JobCard["status"] = "New"): JobCard {
  return {
    jobId: "JOB-2026-0001",
    customer: "c",
    shipmentType: "FCL",
    serviceType: "Export Sea",
    owner: "aom",
    status,
    priority: "Normal",
    deadline,
    createdBy: "jantana",
    createdAt: "2026-08-01T00:00:00.000+07:00",
    updatedAt: "2026-08-01T00:00:00.000+07:00",
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cn", () => {
  it("merges conflicting tailwind classes, last wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps non-conflicting classes", () => {
    expect(cn("font-bold", "text-sm", undefined, false && "hidden")).toBe(
      "font-bold text-sm",
    );
  });
});

describe("nowIso", () => {
  it("returns an ISO string with the +07:00 Bangkok offset", () => {
    expect(nowIso()).toBe("2026-08-17T17:00:00.000+07:00");
  });
});

describe("nextJobId", () => {
  it("increments the max sequence for the current Bangkok year", () => {
    expect(nextJobId(["JOB-2026-0001", "JOB-2026-0007", "JOB-2026-0003"])).toBe(
      "JOB-2026-0008",
    );
  });

  it("starts at 0001 when no ids exist for the year", () => {
    expect(nextJobId([])).toBe("JOB-2026-0001");
  });

  it("ignores other-year and non-matching ids", () => {
    expect(nextJobId(["JOB-2025-0099", "TODO-0001", "job-2026-0010"])).toBe(
      "JOB-2026-0001",
    );
  });

  it("pads the sequence to four digits", () => {
    expect(nextJobId(["JOB-2026-9999"])).toBe("JOB-2026-10000");
  });
});

describe("formatDateTime", () => {
  it("returns empty string for undefined/empty input", () => {
    expect(formatDateTime(undefined)).toBe("");
    expect(formatDateTime("")).toBe("");
  });

  it("returns empty string for invalid input", () => {
    expect(formatDateTime("not-a-date")).toBe("");
  });

  it("formats in Thai locale with Bangkok timezone", () => {
    // 2026-08-14 15:00 Bangkok → "14 ส.ค. 2026 15:00" (Thai calendar year 2569)
    const out = formatDateTime("2026-08-14T15:00:00.000+07:00");
    expect(out).toContain("14");
    expect(out).toContain("ส.ค.");
    expect(out).toContain("2569");
    expect(out).toContain("15:00");
  });
});

describe("daysUntil", () => {
  it("returns positive whole days for future deadlines", () => {
    expect(daysUntil(new Date(NOW.getTime() + 3 * DAYS).toISOString())).toBe(3);
  });

  it("returns negative whole days for past deadlines", () => {
    expect(daysUntil(new Date(NOW.getTime() - 2 * DAYS).toISOString())).toBe(-2);
  });

  it("truncates partial days", () => {
    expect(daysUntil(new Date(NOW.getTime() + 2.9 * DAYS).toISOString())).toBe(
      2,
    );
  });

  it("returns Infinity for missing or invalid input", () => {
    expect(daysUntil(undefined)).toBe(Number.POSITIVE_INFINITY);
    expect(daysUntil("not-a-date")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("isOverdue", () => {
  it("is true for a past deadline on an active job", () => {
    expect(
      isOverdue(jobWith(new Date(NOW.getTime() - DAYS).toISOString())),
    ).toBe(true);
  });

  it("is false for Completed even with a past deadline", () => {
    expect(
      isOverdue(
        jobWith(new Date(NOW.getTime() - DAYS).toISOString(), "Completed"),
      ),
    ).toBe(false);
  });

  it("is false for a future deadline", () => {
    expect(
      isOverdue(jobWith(new Date(NOW.getTime() + DAYS).toISOString())),
    ).toBe(false);
  });

  it("is false for an invalid deadline", () => {
    expect(isOverdue(jobWith("not-a-date"))).toBe(false);
  });
});

describe("isNearDeadline", () => {
  it("is true within the default 24h window", () => {
    expect(
      isNearDeadline(jobWith(new Date(NOW.getTime() + 5 * HOURS).toISOString())),
    ).toBe(true);
  });

  it("includes the boundary at exactly 24h and at now", () => {
    expect(
      isNearDeadline(jobWith(new Date(NOW.getTime() + 24 * HOURS).toISOString())),
    ).toBe(true);
    expect(
      isNearDeadline(jobWith(new Date(NOW.getTime()).toISOString())),
    ).toBe(true);
  });

  it("is false for a past deadline", () => {
    expect(
      isNearDeadline(jobWith(new Date(NOW.getTime() - HOURS).toISOString())),
    ).toBe(false);
  });

  it("is false beyond 24h", () => {
    expect(
      isNearDeadline(
        jobWith(new Date(NOW.getTime() + 25 * HOURS).toISOString()),
      ),
    ).toBe(false);
  });

  it("honors a custom hours window", () => {
    const deadline = new Date(NOW.getTime() + 48 * HOURS).toISOString();
    expect(isNearDeadline(jobWith(deadline))).toBe(false);
    expect(isNearDeadline(jobWith(deadline), 48)).toBe(true);
  });

  it("is false for Completed and invalid deadlines", () => {
    expect(
      isNearDeadline(
        jobWith(new Date(NOW.getTime() + HOURS).toISOString(), "Completed"),
      ),
    ).toBe(false);
    expect(isNearDeadline(jobWith("not-a-date"))).toBe(false);
  });
});
