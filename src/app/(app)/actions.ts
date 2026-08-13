"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/repository";
import {
  PRIORITIES,
  SERVICE_TYPES,
  SHIPMENT_TYPES,
  type JobStatus,
  type Priority,
  type ServiceType,
  type ShipmentType,
} from "@/lib/enums";
import type { CreateJobInput } from "@/lib/types";

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

/**
 * Create a new Job Card. Reads FormData from the create-job form, validates
 * required fields, and seeds template To-dos + activity via the repository.
 * On success revalidates /jobs and redirects there.
 */
export async function createJob(formData: FormData): Promise<never> {
  const user = getCurrentUser();
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
  const user = getCurrentUser();
  const repo = getRepository();
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
  const user = getCurrentUser();
  const repo = getRepository();
  await repo.updateTodo(
    todoId,
    { status: done ? "Done" : "Not Started" },
    user,
  );
  revalidatePath(`/jobs/${jobId}`);
}
