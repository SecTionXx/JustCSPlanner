import { isAiEnabled } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth/current-user";

import { PageHeader, Panel } from "../_components/field";
import { QaClient } from "./_components/qa-client";

export const dynamic = "force-dynamic";

/**
 * AI Q&A over the team's jobs — any role may ask. Rendered only when AI is
 * enabled (AI_API_KEY set); otherwise shows a friendly "ปิดอยู่" panel that
 * points at docs/AI.md. The page itself never calls the provider — that
 * happens in the askAi server action.
 */
export default async function AiPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const aiEnabled = isAiEnabled();

  return (
    <>
      <PageHeader
        title="ถาม AI"
        subtitle="ถามคำถามเกี่ยวกับงานของทีม — ตอบจากข้อมูลงานล่าสุดเท่านั้น ไม่มีการเดา"
      />

      <div className="pt-4 pb-8">
        {aiEnabled ? (
          <Panel title="ผู้ช่วยตอบคำถาม">
            <QaClient currentUser={user} />
          </Panel>
        ) : (
          <Panel title="ฟีเจอร์ AI ปิดอยู่">
            <div className="flex flex-col gap-2 py-2 text-sm text-muted-foreground">
              <p>
                หน้านี้จะใช้งานได้หลังตั้งค่าผู้ให้บริการ AI
                (ปัจจุบันยังไม่ได้ตั้งค่า AI_API_KEY)
              </p>
              <p>
                วิธีเปิด: สร้าง API key ที่{" "}
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground underline"
                >
                  openrouter.ai
                </a>{" "}
                แล้วตั้งค่าในไฟล์ <code className="text-foreground">.env.local</code>{" "}
                ตามรายละเอียดในเอกสาร{" "}
                <code className="text-foreground">docs/AI.md</code>
              </p>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
