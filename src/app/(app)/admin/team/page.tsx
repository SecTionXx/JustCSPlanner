import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageTeam, canViewAdmin } from "@/lib/auth/permissions";
import { getRepository } from "@/lib/repository";

import { PageHeader, Panel } from "../../_components/field";
import { TeamAdminClient } from "./_components/team-admin-client";

export const dynamic = "force-dynamic";

export default async function TeamAdminPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const repo = getRepository();

  if (!canViewAdmin(user)) {
    return (
      <>
        <PageHeader title="จัดการทีม" subtitle="Team management" />
        <div className="pt-4 pb-8">
          <Panel title="ไม่มีสิทธิ์เข้าถึง">
            <p className="py-4 text-center text-sm text-muted-foreground">
              หน้านี้สำหรับ Lead และ Admin เท่านั้น
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const team = await repo.listTeam();
  const canManage = canManageTeam(user);

  return (
    <>
      <PageHeader
        title="จัดการทีม"
        subtitle="เพิ่ม/แก้ไขสมาชิกทีม CS — ส่งผลต่อ dropdown ของเจ้าของงาน"
      />
      <div className="pt-4 pb-8">
        <TeamAdminClient team={team} canManage={canManage} />
      </div>
    </>
  );
}
