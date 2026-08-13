"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  React.useEffect(() => {
    // Surface the error for diagnostics; a real logger would replace this.
    void error;
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span aria-hidden className="text-5xl">
        ⚠️
      </span>
      <h1 className="text-xl font-bold text-foreground">เกิดข้อผิดพลาด</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        ระบบไม่สามารถดำเนินการต่อได้ในขณะนี้ ลองอีกครั้ง หรือกลับไปยังหน้าหลัก
      </p>
      {error.digest ? (
        <p className="text-[11px] text-muted-foreground">รหัสอ้างอิง: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset} className="h-9 rounded-[9px] font-bold">
          ลองอีกครั้ง
        </Button>
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="h-9 rounded-[9px] font-bold"
        >
          กลับหน้าหลัก
        </Button>
      </div>
    </div>
  );
}
