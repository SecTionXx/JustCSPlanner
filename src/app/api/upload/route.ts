// POST /api/upload — multipart/form-data with `file` + `jobId`.
// Uploads the file to Google Drive (same service account as Sheets) and appends
// the returned webViewLink to the job's docLinks. Permission-gated via
// canEditJob; rejects oversized or wrong-type files with Thai messages.
//
// NOTE: an ActivityLog "doc_added" row is NOT written — updateJob's event set
// covers only status/owner/deadline changes and the repository exposes no public
// method for raw activity rows (addNote is hard-coded to note_added). Do not
// reach into repository internals from a route.

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditJob } from "@/lib/auth/permissions";
import { isDriveEnabled, uploadFileToDrive } from "@/lib/drive";
import { getRepository } from "@/lib/repository";

export const runtime = "nodejs"; // Drive upload streams the body (node:stream)

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/** Lowercase extensions accepted for job attachments (no leading dot). */
const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "txt",
  "eml",
  "msg",
]);

const ALLOWED_EXTENSIONS_LABEL = [...ALLOWED_EXTENSIONS].join(", ");

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("รูปแบบคำขอไม่ถูกต้อง (ต้องเป็น multipart/form-data)");
  }

  const file = form.get("file");
  const jobId = form.get("jobId");
  if (!(file instanceof File) || typeof jobId !== "string" || !jobId.trim()) {
    return badRequest("ไม่พบไฟล์หรือรหัสงาน (jobId) ในคำขอ");
  }

  if (file.size > MAX_SIZE_BYTES) {
    return badRequest(
      `ไฟล์ใหญ่เกินกำหนด (สูงสุด ${MAX_SIZE_MB} MB) — โปรดแนบไฟล์ที่เล็กลง`,
    );
  }

  const extension = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return badRequest(
      `ชนิดไฟล์ไม่รองรับ (.${extension || "?"}) — รองรับเฉพาะ: ${ALLOWED_EXTENSIONS_LABEL}`,
    );
  }

  const repo = getRepository();
  const job = await repo.getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: `ไม่พบงาน ${jobId}` },
      { status: 404 },
    );
  }

  const currentUser = await getCurrentUser();
  if (!canEditJob(currentUser, job)) {
    return NextResponse.json(
      { error: "คุณไม่มีสิทธิ์แก้ไขงานนี้ (เจ้าของงาน/ผู้รับฝาก/หัวหน้าเท่านั้น)" },
      { status: 403 },
    );
  }

  if (!isDriveEnabled()) {
    return NextResponse.json(
      {
        error:
          "ระบบอัปโหลดไฟล์ยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า GOOGLE_DRIVE_FOLDER_ID) — โปรดแจ้งผู้ดูแลระบบ",
      },
      { status: 503 },
    );
  }

  let upload: { webViewLink: string };
  try {
    upload = await uploadFileToDrive({
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer: Buffer.from(await file.arrayBuffer()),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "DriveUploadError"
        ? error.message
        : "อัปโหลดไฟล์ไม่สำเร็จ โปรดลองอีกครั้ง";
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/upload] drive upload failed", error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await repo.updateJob(
    jobId,
    { docLinks: [...(job.docLinks ?? []), upload.webViewLink] },
    currentUser,
  );

  return NextResponse.json({ link: upload.webViewLink });
}
