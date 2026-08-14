import { isAiEnabled } from "@/lib/ai/client";
import { getRepository } from "@/lib/repository";

import { PageHeader, Panel } from "../../_components/field";
import { CreateJobForm } from "./_components/create-job-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NewJobPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const repo = getRepository();
  const team = await repo.listTeam();

  // AI draft panel is strictly opt-in: hidden entirely when AI_API_KEY is unset.
  const aiEnabled = isAiEnabled();
  const aiTextRaw = aiEnabled ? single((await searchParams).aiText) : undefined;
  const initialAiText =
    aiTextRaw !== undefined && aiTextRaw.trim() !== "" ? aiTextRaw : undefined;

  return (
    <>
      <PageHeader
        title="สร้าง Job Card ใหม่"
        subtitle="กรอกข้อมูลแล้วระบบจะสร้าง To-do + แจ้ง CS อัตโนมัติ"
      />
      <div className="px-6 pt-4 pb-8">
        <Panel>
          <CreateJobForm team={team} aiEnabled={aiEnabled} initialAiText={initialAiText} />
        </Panel>
      </div>
    </>
  );
}
