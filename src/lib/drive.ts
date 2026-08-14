// Google Drive upload helper (server-only).
// Uses the SAME service account as the Sheets adapter (GOOGLE_APPLICATION_CREDENTIALS)
// to store job attachments in the Drive folder referenced by GOOGLE_DRIVE_FOLDER_ID.
// Env-gated: when either variable is missing, isDriveEnabled() is false and callers
// (the /api/upload route) fail gracefully with a Thai message instead of crashing.

import "server-only";

import { Readable } from "node:stream";

import { google } from "googleapis";

/** Typed error surfaced to the route with a user-facing Thai message. */
export class DriveUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveUploadError";
  }
}

export interface DriveFileInput {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export interface DriveUploadResult {
  webViewLink: string;
}

/**
 * True when both the Drive folder id and the service-account key file are
 * configured. Read at call time (not module load) so .env changes apply on
 * server restart without caching surprises.
 */
export function isDriveEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

// Single shared, lazily-built client (same pattern as the Sheets adapter).
let _drive: ReturnType<typeof google.drive> | null = null;
function client() {
  if (!_drive) {
    const auth = new google.auth.GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    _drive = google.drive({ version: "v3", auth });
  }
  return _drive;
}

/**
 * Upload one file into the configured Drive folder and return its webViewLink
 * (the human-friendly link stored in JobCards.docLinks). Throws DriveUploadError
 * with a Thai message when Drive is not configured or the API call fails.
 */
export async function uploadFileToDrive(
  file: DriveFileInput,
): Promise<DriveUploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new DriveUploadError(
      "ระบบอัปโหลดไฟล์ยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า Google Drive) — โปรดแจ้งผู้ดูแลระบบ",
    );
  }

  try {
    const res = await client().files.create({
      requestBody: { name: file.name, parents: [folderId] },
      media: { mimeType: file.mimeType, body: Readable.from(file.buffer) },
      supportsAllDrives: true,
      fields: "webViewLink",
    });
    const webViewLink = res.data.webViewLink;
    if (!webViewLink) {
      throw new DriveUploadError(
        "อัปโหลดไปที่ Google Drive แล้ว แต่ไม่ได้รับลิงก์ไฟล์กลับมา โปรดลองอีกครั้ง",
      );
    }
    return { webViewLink };
  } catch (error) {
    if (error instanceof DriveUploadError) throw error;
    if (process.env.NODE_ENV !== "production") {
      console.error("[drive] upload failed", error);
    }
    throw new DriveUploadError(
      "อัปโหลดไฟล์ไปที่ Google Drive ไม่สำเร็จ โปรดลองอีกครั้ง",
    );
  }
}
