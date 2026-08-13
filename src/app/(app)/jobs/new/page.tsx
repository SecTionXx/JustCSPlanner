import { getRepository } from "@/lib/repository";

import { PageHeader, Panel } from "../../_components/field";
import { CreateJobForm } from "./_components/create-job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage(): Promise<React.ReactElement> {
  const repo = getRepository();
  const team = await repo.listTeam();

  return (
    <>
      <PageHeader
        title="สร้าง Job Card ใหม่"
        subtitle="กรอกข้อมูลแล้วระบบจะสร้าง To-do + แจ้ง CS อัตโนมัติ"
      />
      <div className="px-6 pt-4 pb-8">
        <Panel>
          <CreateJobForm team={team} />
        </Panel>
      </div>
    </>
  );
}
