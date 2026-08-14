"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DEV_USERS, getCurrentUser } from "@/lib/auth/current-user";
import {
  canAddNote,
  canAddTodo,
  canChangeDeadline,
  canChangeStatus,
  canCloseJob,
  canCreateJob,
  canDeleteTodo,
  canEditJob,
  canReassign,
  canToggleTodo,
} from "@/lib/auth/permissions";
import { getRepository } from "@/lib/repository";
import type { UpdateJobOptions } from "@/lib/repository";
import {
  PRIORITIES,
  SERVICE_TYPES,
  SHIPMENT_TYPES,
  type JobStatus,
  type Priority,
  type ServiceType,
  type ShipmentType,
} from "@/lib/enums";
import type { CreateJobInput, JobPatch } from "@/lib/types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function asString(value: FormDataEntryValue | null | undefined): string {
  if (value == null) return "";
  return isString(value) ? value : String(value);
}

function requireString(label: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(`กรุณาระบุ${label}`);
  return trimmed;
}

function asStringList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Throw a bilingual permission error when the check fails. */
function assertCan(allowed: boolean, label = ""): void {
  if (!allowed) {
    throw new Error(
      label
        ? `ไม่มีสิทธิ์ดำเนินการ: ${label}`
        : "ไม่มีสิทธิ์ดำเนินการ (No permission)",
    );
  }
}

const DEV_USER_COOKIE = "dev_user";
const DEV_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Dev-only role switcher: sets the `dev_user` cookie so getCurrentUser()
 * resolves to the chosen user on the next request. Validates csId against
 * DEV_USERS.
 */
export async function switchDevUser(csId: string): Promise<void> {
  if (!DEV_USERS[csId]) {
    throw new Error(`Unknown dev user: ${csId}`);
  }
  const store = await cookies();
  store.set(DEV_USER_COOKIE, csId, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: DEV_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Create a new Job Card. Reads FormData from the create-job form, validates
 * required fields, and seeds template To-dos + activity via the repository.
 * On success revalidates /jobs and redirects there.
 */
export async function createJob(formData: FormData): Promise<never> {
  const user = await getCurrentUser();
  assertCan(canCreateJob(user), "สร้างงาน");
  const repo = getRepository();

  const customer = requireString("ชื่อลูกค้า", asString(formData.get("customer")));
  const title = requireString("ชื่องาน", asString(formData.get("title")));
  const owner = requireString("เจ้าของงาน (Owner)", asString(formData.get("owner")));
  const deadlineRaw = requireString("Deadline", asString(formData.get("deadline")));

  // datetime-local gives "YYYY-MM-DDTHH:mm" without offset; attach +07:00.
  const deadline = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(deadlineRaw)
    ? `${deadlineRaw}:00+07:00`
    : deadlineRaw;

  const shipmentTypeRaw = asString(formData.get("shipmentType"));
  const serviceTypeRaw = asString(formData.get("serviceType"));
  const statusRaw = asString(formData.get("status")) || "New";
  const priorityRaw = asString(formData.get("priority")) || "Normal";

  const shipmentType = (
    SHIPMENT_TYPES.includes(shipmentTypeRaw as ShipmentType)
      ? (shipmentTypeRaw as ShipmentType)
      : "FCL"
  );
  const serviceType = (
    SERVICE_TYPES.includes(serviceTypeRaw as ServiceType)
      ? (serviceTypeRaw as ServiceType)
      : "Export Sea"
  );
  const priority = (
    PRIORITIES.includes(priorityRaw as Priority) ? (priorityRaw as Priority) : "Normal"
  );
  const status = statusRaw as JobStatus;

  const bookingNumber = asString(formData.get("bookingNumber")) || undefined;
  const route = asString(formData.get("route")) || undefined;
  const carrier = asString(formData.get("carrier")) || undefined;
  const eta = asString(formData.get("eta")) || undefined;
  const etd = asString(formData.get("etd")) || undefined;
  const docLinksRaw = asString(formData.get("docLinks"));
  const docLinks = docLinksRaw ? asStringList(docLinksRaw) : undefined;
  const note = asString(formData.get("note"));

  const input: CreateJobInput = {
    customer,
    bookingNumber,
    shipmentType,
    serviceType,
    route,
    carrier,
    eta,
    etd,
    owner,
    status,
    priority,
    deadline,
    docLinks,
    latestSummary: note.trim() || title,
  };

  await repo.createJob(input, user);
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect("/jobs");
}

/**
 * Change a job's status. Captures the old→new value in the ActivityLog via
 * repo.updateJob.
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  reason?: string,
): Promise<void> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) throw new Error("ไม่พบงานที่ต้องการอัปเดต");
  if (status === "Completed") {
    assertCan(canCloseJob(user, job), "ปิดงาน");
  } else {
    assertCan(canChangeStatus(user, job), "เปลี่ยนสถานะ");
  }
  await repo.updateJob(jobId, { status }, user, reason ? { reason } : undefined);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

/**
 * Toggle a To-do between Done / Not Started.
 */
export async function toggleTodo(
  todoId: string,
  done: boolean,
  jobId: string,
): Promise<void> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) throw new Error("ไม่พบงานที่ต้องการอัปเดต");
  assertCan(canToggleTodo(user, job), "ทำเครื่องหมาย To-do");
  await repo.updateTodo(
    todoId,
    { status: done ? "Done" : "Not Started" },
    user,
  );
  revalidatePath(`/jobs/${jobId}`);
}

/**
 * Edit an existing Job Card. If `patch` changes the owner or deadline,
 * `options.reason` MUST be provided — the repository enforces this and will
 * throw otherwise. The UI must collect a reason first (high-trust rule).
 */
export async function editJob(
  jobId: string,
  patch: JobPatch,
  options?: UpdateJobOptions,
): Promise<void> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) throw new Error("ไม่พบงานที่ต้องการแก้ไข");

  const ownerChanged = patch.owner !== undefined && patch.owner !== job.owner;
  const deadlineChanged =
    patch.deadline !== undefined && patch.deadline !== job.deadline;

  if (ownerChanged) {
    assertCan(canReassign(user), "เปลี่ยนเจ้าของงาน");
  } else if (deadlineChanged) {
    assertCan(canChangeDeadline(user), "เปลี่ยน Deadline");
  } else {
    assertCan(canEditJob(user, job), "แก้ไขงาน");
  }

  await repo.updateJob(jobId, patch, user, options);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

/**
 * Add a manually-assigned To-do to a job.
 */
export async function addTodo(
  jobId: string,
  title: string,
  assignee: string,
  deadline?: string,
): Promise<void> {
  const trimmedTitle = title.trim();
  const trimmedAssignee = assignee.trim();
  if (!trimmedTitle) throw new Error("กรุณาระบุชื่อ To-do");
  if (!trimmedAssignee) throw new Error("กรุณาระบุผู้รับมอบหมาย");

  const user = await getCurrentUser();
  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) throw new Error("ไม่พบงานที่ต้องการเพิ่ม To-do");
  assertCan(canAddTodo(user, job), "เพิ่ม To-do");
  await repo.createTodo(
    { jobId, title: trimmedTitle, assignee: trimmedAssignee, source: "Assigned", deadline },
    user,
  );
  revalidatePath(`/jobs/${jobId}`);
}

/**
 * Delete a To-do.
 */
export async function deleteTodoAction(
  todoId: string,
  jobId: string,
): Promise<void> {
  const user = await getCurrentUser();
  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) throw new Error("ไม่พบงานที่ต้องการลบ To-do");
  assertCan(canDeleteTodo(user, job), "ลบ To-do");
  await repo.deleteTodo(todoId);
  revalidatePath(`/jobs/${jobId}`);
}

/**
 * Add a comment/note to a job. Persisted as an ActivityLog row (note_added).
 */
export async function addComment(jobId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("กรุณาระบุข้อความคอมเมนต์");

  const user = await getCurrentUser();
  assertCan(canAddNote(user), "เพิ่มคอมเมนต์");
  const repo = getRepository();
  await repo.addNote(jobId, trimmed, user);
  revalidatePath(`/jobs/${jobId}`);
}
