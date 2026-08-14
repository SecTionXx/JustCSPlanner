"use server";

import { AiError, completeJson, isAiEnabled } from "@/lib/ai/client";
import { jobQaSystemPrompt } from "@/lib/ai/prompts";
import { validateJobAnswer } from "@/lib/ai/schema";
import { getRepository } from "@/lib/repository";
import type { CurrentUser, JobCard } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

/**
 * Server action behind the /ai Q&A page. Every role may ask — answers are
 * grounded ONLY in the minimized projection built below; notes, doc links,
 * summaries, and every other JobCard field never leave the app.
 */

/** Hard cap on how many jobs are sent to the provider (impl guide §8.2). */
const MAX_JOBS_SENT = 50;

/** Upper bound for a question — longer input is rejected, not truncated. */
const MAX_QUESTION_LENGTH = 1000;

/**
 * The ONLY job shape that ever reaches the AI provider. Kept hand-rolled on
 * purpose: adding a field here is a deliberate data-boundary decision.
 */
interface JobProjection {
  jobId: string;
  customer: string;
  status: JobCard["status"];
  priority: JobCard["priority"];
  owner: string;
  /** Bangkok-formatted wall time, e.g. "14 ส.ค. 2026 15:00". */
  deadline: string;
  serviceType: JobCard["serviceType"];
  shipmentType: JobCard["shipmentType"];
}

/** Result envelope — `enabled:false` means AI is off; `error` is Thai. */
export interface AskAiResult {
  enabled: boolean;
  answer?: string;
  error?: string;
}

/** Project one JobCard down to the minimized AI shape. */
function projectJob(job: JobCard): JobProjection {
  return {
    jobId: job.jobId,
    customer: job.customer,
    status: job.status,
    priority: job.priority,
    owner: job.owner,
    deadline: formatDateTime(job.deadline),
    serviceType: job.serviceType,
    shipmentType: job.shipmentType,
  };
}

/**
 * Answer a question about the team's jobs. Reads `listJobs()` (never writes),
 * keeps the latest 50 active (non-Completed) jobs, and calls the AI seam.
 * Never throws — failures come back as a Thai `error` string.
 */
export async function askAi(
  question: string,
  currentUser: CurrentUser,
): Promise<AskAiResult> {
  if (!isAiEnabled()) {
    return { enabled: false };
  }
  if (!currentUser?.csId) {
    return { enabled: true, error: "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" };
  }

  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { enabled: true, error: "กรุณาพิมพ์คำถามก่อนกดถาม" };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      enabled: true,
      error: `คำถามยาวเกินไป (สูงสุด ${MAX_QUESTION_LENGTH} ตัวอักษร)`,
    };
  }

  const jobs = await getRepository().listJobs();
  const activeJobs = jobs.filter((job) => job.status !== "Completed");
  const capped = activeJobs.length > MAX_JOBS_SENT;
  const projection = activeJobs
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, MAX_JOBS_SENT)
    .map(projectJob);

  const userMessage =
    trimmed +
    "\n\nข้อมูลงาน (JSON):\n" +
    JSON.stringify(projection) +
    (capped ? `\nหมายเหตุ: แสดง ${MAX_JOBS_SENT} งานล่าสุด` : "");

  try {
    const result = await completeJson(
      jobQaSystemPrompt(),
      userMessage,
      validateJobAnswer,
    );
    return { enabled: true, answer: result.answer };
  } catch (error) {
    const message =
      error instanceof AiError
        ? error.message
        : "เรียกบริการ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    return { enabled: true, error: message };
  }
}
