import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 py-12 text-center">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <SearchX className="size-7" />
      </span>
      <h1 className="text-xl font-bold text-foreground">ไม่พบงานที่ค้นหา</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Job Card นี้อาจถูกลบ หรือ Job ID ไม่ถูกต้อง
      </p>
      <Button render={<Link href="/jobs" />} className="mt-2 h-9 rounded-[9px] font-bold">
        <ArrowLeft aria-hidden className="size-4" />
        กลับไปรายการงาน
      </Button>
    </div>
  );
}
