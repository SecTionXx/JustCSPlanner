import { canViewAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";

import { PageHeader, Panel } from "../../_components/field";
import { RunScanButton } from "./_components/run-scan-button";

export const dynamic = "force-dynamic";

export default async function ScanPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (!canViewAdmin(user)) {
    return (
      <>
        <PageHeader title="สแกนเตือน Deadline" subtitle="Scheduled scan" />
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

  return (
    <>
      <PageHeader
        title="สแกนเตือน Deadline"
        subtitle="ส่งการแจ้งเตือน deadline, งานเลยกำหนด, และติดตามงานค้างให้เจ้าของงาน"
        actions={<RunScanButton />}
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 pb-8 lg:grid-cols-2">
        <Panel title="การแจ้งเตือนที่สแกนส่ง">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">⏰ 24 ชม.</strong> —
              เตือนเจ้าของงานเมื่อ deadline เหลือไม่เกิน 24 ชม.
            </li>
            <li>
              <strong className="text-foreground">⏰ 4 ชม.</strong> —
              เตือนด่วนเมื่อ deadline เหลือไม่เกิน 4 ชม.
            </li>
            <li>
              <strong className="text-foreground">🚨 เลยกำหนด</strong> —
              เตือนเจ้าของงานเมื่อเลย deadline แล้ว
            </li>
            <li>
              <strong className="text-foreground">🆘 เลื่อนขึ้นผู้บริหาร</strong> —
              งาน Critical เลยกำหนดเกิน 2 ชม. → แจ้ง Lead
            </li>
            <li>
              <strong className="text-foreground">⏳ ติดตามงานค้าง</strong> —
              สถานะ Waiting เกิน 24 ชม. → เตือนเจ้าของติดตาม
            </li>
          </ul>
        </Panel>

        <Panel title="การตั้งเวลาอัตโนมัติ (Scheduling)">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Cron endpoint:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                GET /api/cron/scan
              </code>
            </p>
            <p className="text-xs">
              ตั้งเวลาด้วยวิธีใดวิธีหนึ่ง:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-xs">
              <li>
                Vercel Cron — เพิ่ม path{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  /api/cron/scan
                </code>{" "}
                ใน vercel.json (แนะนำทุก 1–2 ชม.)
              </li>
              <li>
                External cron — เรียกด้วย{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  curl -H &quot;Authorization: Bearer $CRON_SECRET&quot;
                </code>
              </li>
              <li>กดปุ่ม &quot;รันสแกนตอนนี้&quot; ด้านบนเพื่อรันด้วยมือ</li>
            </ul>
            <p className="text-xs">
              หาก <code className="rounded bg-muted px-1 py-0.5">CRON_SECRET</code>{" "}
              ยังไม่ได้ตั้ง → endpoint ทำงานโดยไม่ตรวจสิทธิ์พร้อมแสดง warning
              (สำหรับ dev เท่านั้น)
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
