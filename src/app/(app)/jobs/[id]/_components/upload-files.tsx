"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export interface UploadFilesProps {
  jobId: string;
}

/**
 * Real upload control for the job detail page: a hidden file input triggered by
 * the "+ อัปโหลดไฟล์" pill. On select it POSTs the file to /api/upload; on
 * success router.refresh() re-renders the server component so the new chip
 * appears. Server-side errors (size/type/permission/Drive config) are surfaced
 * in Thai next to the pill. Rendered only for users who can edit the job.
 */
export function UploadFiles({ jobId }: UploadFilesProps): React.ReactElement {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    // Reset so picking the same file again re-fires onChange.
    event.target.value = "";
    if (!file || pending) return;

    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("jobId", jobId);
      const res = await fetch("/api/upload", { method: "POST", body });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "อัปโหลดไฟล์ไม่สำเร็จ โปรดลองอีกครั้ง");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ โปรดลองอีกครั้ง");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        aria-label="เลือกไฟล์แนบ"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center rounded-[7px] border border-status-completed/30 bg-status-completed-soft px-2.5 py-1 text-xs font-semibold text-status-completed transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "กำลังอัปโหลด..." : "+ อัปโหลดไฟล์"}
      </button>
      {error ? (
        <span className="max-w-[260px] truncate text-xs text-destructive" title={error}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
