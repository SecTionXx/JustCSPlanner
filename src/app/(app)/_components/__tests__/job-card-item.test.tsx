import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import {
  JobCardItem,
  JobListItem,
} from "@/app/(app)/_components/job-card-item";
import {
  buildJob,
  completedJob,
  nearDeadlineJob,
  overdueJob,
} from "@/test/fixtures";

const NOW = new Date("2026-08-17T10:00:00Z"); // 17:00 Bangkok

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("JobCardItem", () => {
  it("renders jobId, customer, route, and badges", () => {
    render(<JobCardItem job={buildJob()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jobs/JOB-2026-0100");
    expect(within(link).getByText("บริษัท ตัวอย่าง จำกัด")).toBeInTheDocument();
    expect(within(link).getByText(/JOB-2026-0100/)).toBeInTheDocument();
    expect(within(link).getByText("Bangkok → Singapore")).toBeInTheDocument();
    expect(within(link).getByText("กำลังดำเนินการ")).toBeInTheDocument();
    expect(within(link).getByText("ปกติ")).toBeInTheDocument();
  });

  it("hides booking number and route when absent", () => {
    render(
      <JobCardItem job={buildJob({ bookingNumber: undefined, route: undefined })} />,
    );
    expect(screen.queryByText(/BK-001/)).toBeNull();
    expect(screen.queryByText(/Bangkok/)).toBeNull();
  });

  it("marks an overdue job with a danger pill", () => {
    render(<JobCardItem job={overdueJob()} />);
    const pill = screen.getByText(/^เกินกำหนด/);
    expect(pill.textContent).toMatch(/เกินกำหนด \d+d/);
    expect(pill.className).toContain("bg-tone-danger-soft");
  });

  it("marks a near-deadline job with a warn pill showing hours", () => {
    render(<JobCardItem job={nearDeadlineJob(5)} />);
    const pill = screen.getByText(/^ใกล้ Cut-off/);
    expect(pill.textContent).toContain("ใกล้ Cut-off 5h");
    expect(pill.className).toContain("bg-tone-warning-soft");
  });

  it("uses the default tone for a healthy future deadline", () => {
    render(<JobCardItem job={buildJob()} />);
    const pill = document.querySelector("span.bg-muted.text-muted-foreground");
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toMatch(/ส\.ค\./);
    expect(pill?.textContent).not.toMatch(/เกินกำหนด|ใกล้ Cut-off/);
  });

  it("never marks a Completed job as overdue even with a past deadline", () => {
    render(<JobCardItem job={completedJob({ deadline: new Date(NOW.getTime() - 86400000).toISOString() })} />);
    expect(screen.queryByText(/^เกินกำหนด/)).toBeNull();
  });
});

describe("JobListItem", () => {
  it("renders a dense row linking to the job", () => {
    render(<JobListItem job={buildJob()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jobs/JOB-2026-0100");
    expect(within(link).getByText("บริษัท ตัวอย่าง จำกัด")).toBeInTheDocument();
    expect(within(link).getByText("กำลังดำเนินการ")).toBeInTheDocument();
  });

  it("marks an overdue job with a danger pill", () => {
    render(<JobListItem job={overdueJob()} />);
    expect(screen.getByText(/^เกินกำหนด/).className).toContain(
      "bg-tone-danger-soft",
    );
  });
});
