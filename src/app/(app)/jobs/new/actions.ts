// Server action for the AI draft panel on /jobs/new (P3.1).
//
// Read-only AI path: sends ONLY the pasted text to the AI seam and returns a
// validated JobDraft for human review. NEVER touches the repository — the
// actual job is still created by the untouched createJob action after the
// user confirms.

"use server";

import { completeJson, isAiEnabled } from "@/lib/ai/client";
import { jobExtractionSystemPrompt } from "@/lib/ai/prompts";
import { validateJobDraft, type JobDraft } from "@/lib/ai/schema";

/** Cap pasted text sent to the provider — matches the panel's textarea limit. */
const MAX_TEXT_LENGTH = 8_000;

export interface DraftJobResult {
  /** False when AI is not configured — callers hide the panel entirely. */
  enabled: boolean;
  draft?: JobDraft;
  error?: string;
}

/**
 * Extract a JobDraft from pasted message text. Returns a result object —
 * never throws; AI/configuration failures become Thai error strings.
 */
export async function draftJobFromText(text: string): Promise<DraftJobResult> {
  if (!isAiEnabled()) {
    return { enabled: false };
  }

  const trimmed = text.trim();
  if (trimmed === "") {
    return { enabled: true, error: "กรุณาวางข้อความก่อนกดร่างงาน" };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      enabled: true,
      error: `ข้อความยาวเกินกำหนด (สูงสุด ${MAX_TEXT_LENGTH.toLocaleString("th-TH")} ตัวอักษร)`,
    };
  }

  try {
    const draft = await completeJson(
      jobExtractionSystemPrompt(),
      trimmed,
      validateJobDraft,
    );
    return { enabled: true, draft };
  } catch (error) {
    const reason =
      error instanceof Error && error.message !== ""
        ? error.message
        : "ไม่ทราบสาเหตุ";
    return {
      enabled: true,
      error: `ร่างงานจาก AI ไม่สำเร็จ (${reason}) — ลองอีกครั้ง หรือกรอกแบบฟอร์มเอง`,
    };
  }
}
