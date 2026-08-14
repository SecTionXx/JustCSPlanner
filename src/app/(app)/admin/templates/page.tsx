import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageTemplates, canViewAdmin } from "@/lib/auth/permissions";
import { SERVICE_TYPES, type ServiceType } from "@/lib/enums";
import { getRepository } from "@/lib/repository";
import type { Template } from "@/lib/types";

import { PageHeader, Panel } from "../../_components/field";
import { TemplatesAdminClient } from "./_components/templates-admin-client";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<ServiceType, string> = {
  "Export Sea": "Export Sea (ส่งออกทางเรือ)",
  "Import Sea": "Import Sea (นำเข้าทางเรือ)",
  "Air Freight": "Air Freight (ขนส่งทางอากาศ)",
};

export default async function TemplatesAdminPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (!canViewAdmin(user)) {
    return (
      <>
        <PageHeader title="จัดการเทมเพลต" subtitle="Template management" />
        <div className="px-6 pt-4 pb-8">
          <Panel title="ไม่มีสิทธิ์เข้าถึง">
            <p className="py-4 text-center text-sm text-muted-foreground">
              หน้านี้สำหรับ Lead และ Admin เท่านั้น
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const repo = getRepository();
  const templates = await repo.listTemplates();
  const canManage = canManageTemplates(user);

  const grouped: { type: ServiceType; label: string; rows: Template[] }[] =
    SERVICE_TYPES.map((type) => ({
      type,
      label: SERVICE_LABELS[type],
      rows: templates
        .filter((t) => t.templateType === type)
        .sort((a, b) => a.order - b.order),
    }));

  return (
    <>
      <PageHeader
        title="จัดการเทมเพลต"
        subtitle="รายการ To-do เริ่มต้นตามประเภทงาน — ใช้ตอนสร้าง Job Card ใหม่"
      />
      <div className="px-6 pt-4 pb-8">
        <div
          className="mb-4 rounded-[10px] border bg-white p-3 text-xs text-muted-foreground"
          style={{ borderColor: "var(--border)" }}
        >
          การแก้ไขเทมเพลตมีผลกับงานที่สร้างใหม่เท่านั้น — งานที่มีอยู่แล้วยังใช้ To-do เดิม
        </div>
        <TemplatesAdminClient groups={grouped} canManage={canManage} />
      </div>
    </>
  );
}
