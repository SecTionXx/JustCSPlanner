"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageTeam, canManageTemplates } from "@/lib/auth/permissions";
import {
  getRepository,
  type CreateTeamMemberInput,
  type CreateTemplateInput,
  type TeamMemberPatch,
  type TemplatePatch,
} from "@/lib/repository";
import { ROLES, SERVICE_TYPES, type Role, type ServiceType } from "@/lib/enums";

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

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

/**
 * Create a TeamMember. Admin only (canManageTeam). When `csId` is omitted the
 * repository derives a slug from displayName. Revalidates /admin/team and the
 * /jobs/new owner dropdown so the new member appears immediately.
 */
export async function createTeamMember(
  input: CreateTeamMemberInput,
): Promise<void> {
  const displayName = input.displayName?.trim();
  if (!displayName) throw new Error("กรุณาระบุชื่อสมาชิก");

  const roleRaw = input.role;
  if (!isRole(roleRaw)) throw new Error("บทบาท (role) ไม่ถูกต้อง");

  const user = await getCurrentUser();
  assertCan(canManageTeam(user), "จัดการทีม");

  const repo = getRepository();
  await repo.createTeamMember(
    {
      csId: input.csId?.trim() ? input.csId.trim().toLowerCase() : undefined,
      displayName,
      role: roleRaw,
      email: input.email?.trim() || undefined,
    },
    user,
  );
  revalidatePath("/admin/team");
  revalidatePath("/jobs/new");
}

/**
 * Update a TeamMember by csId (rename, change role, update email, or toggle
 * active). Admin only.
 */
export async function updateTeamMember(
  csId: string,
  patch: TeamMemberPatch,
): Promise<void> {
  if (!csId?.trim()) throw new Error("กรุณาระบุ csId");

  if (patch.role !== undefined && !isRole(patch.role)) {
    throw new Error("บทบาท (role) ไม่ถูกต้อง");
  }

  const user = await getCurrentUser();
  assertCan(canManageTeam(user), "จัดการทีม");

  const cleanPatch: TeamMemberPatch = { ...patch };
  if (patch.displayName !== undefined) {
    const trimmed = patch.displayName.trim();
    if (!trimmed) throw new Error("กรุณาระบุชื่อสมาชิก");
    cleanPatch.displayName = trimmed;
  }
  if (patch.email !== undefined) {
    cleanPatch.email = patch.email.trim() || undefined;
  }

  const repo = getRepository();
  await repo.updateTeamMember(csId, cleanPatch, user);
  revalidatePath("/admin/team");
  revalidatePath("/jobs/new");
}

/**
 * Create a Template row. Lead/admin only (canManageTemplates). PK is
 * templateType + order.
 */
export async function createTemplate(
  input: CreateTemplateInput,
): Promise<void> {
  if (!isServiceType(input.templateType)) {
    throw new Error("ประเภทงาน (templateType) ไม่ถูกต้อง");
  }
  if (!Number.isInteger(input.order) || input.order < 1) {
    throw new Error("ลำดับ (order) ต้องเป็นจำนวนเต็มบวก");
  }
  const todoTitle = input.todoTitle?.trim();
  if (!todoTitle) throw new Error("กรุณาระบุชื่อ To-do");
  if (
    !Number.isFinite(input.deadlineOffsetHours) ||
    input.deadlineOffsetHours < 0
  ) {
    throw new Error("deadlineOffsetHours ต้องเป็นจำนวนไม่ติดลบ");
  }

  const user = await getCurrentUser();
  assertCan(canManageTemplates(user), "จัดการเทมเพลต");

  const repo = getRepository();
  await repo.createTemplate(
    {
      templateType: input.templateType,
      order: input.order,
      todoTitle,
      deadlineOffsetHours: input.deadlineOffsetHours,
      notes: input.notes?.trim() || undefined,
    },
    user,
  );
  revalidatePath("/admin/templates");
}

/**
 * Patch a Template by composite PK (templateType + order). Lead/admin only.
 */
export async function updateTemplate(
  templateType: ServiceType,
  order: number,
  patch: TemplatePatch,
): Promise<void> {
  if (!isServiceType(templateType)) {
    throw new Error("ประเภทงาน (templateType) ไม่ถูกต้อง");
  }
  if (!Number.isInteger(order) || order < 1) {
    throw new Error("ลำดับ (order) ต้องเป็นจำนวนเต็มบวก");
  }

  const cleanPatch: TemplatePatch = { ...patch };
  if (patch.todoTitle !== undefined) {
    const trimmed = patch.todoTitle.trim();
    if (!trimmed) throw new Error("กรุณาระบุชื่อ To-do");
    cleanPatch.todoTitle = trimmed;
  }
  if (
    patch.deadlineOffsetHours !== undefined &&
    (!Number.isFinite(patch.deadlineOffsetHours) ||
      patch.deadlineOffsetHours < 0)
  ) {
    throw new Error("deadlineOffsetHours ต้องเป็นจำนวนไม่ติดลบ");
  }

  const user = await getCurrentUser();
  assertCan(canManageTemplates(user), "จัดการเทมเพลต");

  const repo = getRepository();
  await repo.updateTemplate(templateType, order, cleanPatch, user);
  revalidatePath("/admin/templates");
}

/**
 * Delete a Template by composite PK (templateType + order). Lead/admin only.
 */
export async function deleteTemplate(
  templateType: ServiceType,
  order: number,
): Promise<void> {
  if (!isServiceType(templateType)) {
    throw new Error("ประเภทงาน (templateType) ไม่ถูกต้อง");
  }
  if (!Number.isInteger(order) || order < 1) {
    throw new Error("ลำดับ (order) ต้องเป็นจำนวนเต็มบวก");
  }

  const user = await getCurrentUser();
  assertCan(canManageTemplates(user), "จัดการเทมเพลต");

  const repo = getRepository();
  await repo.deleteTemplate(templateType, order, user);
  revalidatePath("/admin/templates");
}
