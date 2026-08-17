// Fixture builders for component tests. Base shapes mirror src/lib/mock/data.ts
// seeds; overrides merge immutably. Deadline presets are computed from
// Date.now() — pair with vi.setSystemTime for determinism.
import type {
  ActivityLog,
  JobCard,
  Notification,
  TeamMember,
  Template,
  Todo,
} from "@/lib/types";

const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export function buildJob(overrides: Partial<JobCard> = {}): JobCard {
  return {
    jobId: "JOB-2026-0100",
    customer: "บริษัท ตัวอย่าง จำกัด",
    bookingNumber: "BK-001",
    shipmentType: "FCL",
    serviceType: "Export Sea",
    route: "Bangkok → Singapore",
    origin: "Bangkok",
    destination: "Singapore",
    carrier: "ONE",
    owner: "aom",
    backup: "may",
    status: "In Progress",
    priority: "Normal",
    deadline: isoFromNow(3 * DAYS),
    cutoff: isoFromNow(2 * DAYS),
    etd: isoFromNow(4 * DAYS),
    eta: isoFromNow(10 * DAYS),
    latestSummary: "กำลังรอใบขนสินค้า",
    docLinks: [],
    createdBy: "jantana",
    createdAt: isoFromNow(-5 * DAYS),
    updatedAt: isoFromNow(-1 * DAYS),
    ...overrides,
  };
}

export function overdueJob(overrides: Partial<JobCard> = {}): JobCard {
  return buildJob({ deadline: isoFromNow(-2 * DAYS), ...overrides });
}

export function nearDeadlineJob(
  hours = 5,
  overrides: Partial<JobCard> = {},
): JobCard {
  return buildJob({ deadline: isoFromNow(hours * HOURS), ...overrides });
}

export function completedJob(overrides: Partial<JobCard> = {}): JobCard {
  return buildJob({ status: "Completed", ...overrides });
}

export function buildTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    todoId: "TODO-00001",
    jobId: "JOB-2026-0100",
    title: "ตรวจสอบใบขนสินค้า",
    assignee: "aom",
    status: "Not Started",
    deadline: isoFromNow(1 * DAYS),
    source: "Template",
    createdBy: "jantana",
    createdAt: isoFromNow(-1 * DAYS),
    ...overrides,
  };
}

export function buildTeamMember(
  overrides: Partial<TeamMember> = {},
): TeamMember {
  return {
    csId: "aom",
    displayName: "ออม สุชานาฏ",
    role: "cs_owner",
    active: true,
    email: "aom@example.com",
    ...overrides,
  };
}

export function buildTemplate(overrides: Partial<Template> = {}): Template {
  return {
    templateType: "Export Sea",
    order: 1,
    todoTitle: "จองตู้ตัวแม่ขนส่ง",
    deadlineOffsetHours: 72,
    ...overrides,
  };
}

export function buildActivityLog(
  overrides: Partial<ActivityLog> = {},
): ActivityLog {
  return {
    logId: "LOG-000001",
    jobId: "JOB-2026-0100",
    actor: "jantana",
    timestamp: isoFromNow(-1 * DAYS),
    event: "job_created",
    ...overrides,
  };
}

export function buildNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    notifId: "NOTIF-000001",
    recipientCsId: "aom",
    event: "deadline_changed",
    channel: "in-app",
    subject: "เปลี่ยนกำหนดส่ง JOB-2026-0100",
    body: "เปลี่ยนจาก A เป็น B",
    status: "sent",
    createdAt: isoFromNow(-1 * HOURS),
    ...overrides,
  };
}
