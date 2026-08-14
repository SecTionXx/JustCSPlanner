// AI client seam — the ONLY module that talks to an external LLM provider
// (OpenRouter's OpenAI-compatible chat completions API by default).
//
// Strictly opt-in: when AI_API_KEY is unset, isAiEnabled() is false and every
// AI feature must hide itself. Nothing ever errors from AI being unset —
// callers guard with isAiEnabled() before calling completeJson().
//
// Data boundary: completeJson() sends EXACTLY the caller-provided system +
// user text — never Sheet credentials, never the dataset. See docs/AI.md.

import "server-only";

/** Default endpoint — OpenRouter (OpenAI-compatible). Overridable via AI_BASE_URL. */
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Fallback model when AI_MODEL is unset. Documented in .env.example —
 * production deployments should set AI_MODEL explicitly.
 */
const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

/** Hard timeout for every AI call — callers must never wait unbounded. */
const TIMEOUT_MS = 30_000;

/** App title sent as OpenRouter attribution (harmless on other endpoints). */
const APP_TITLE = "JustCSPlanner";

/** Typed error for every AI failure. Callers catch AiError; pages never crash. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

/**
 * True only when AI_API_KEY is set to a non-empty value. Every AI feature
 * checks this first and stays hidden when it returns false.
 */
export function isAiEnabled(): boolean {
  const key = process.env.AI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Pull choices[0].message.content out of an OpenAI-style response. */
function extractContent(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.choices)) return null;
  const first = data.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) return null;
  const content = first.message.content;
  return typeof content === "string" ? content : null;
}

/** Strip a wrapping ``` / ```json markdown code fence if present. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Call the chat completions endpoint and return the parsed + validated JSON.
 * Sends only `system` and `user` to the provider — nothing else leaves the app.
 * Throws AiError on disabled config, timeout, HTTP error, bad JSON, or when
 * the caller-supplied validator rejects the payload (returns null).
 */
export async function completeJson<T>(
  system: string,
  user: string,
  parse: (raw: unknown) => T | null,
): Promise<T> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiError("ฟีเจอร์ AI ไม่ได้เปิดใช้งาน (ไม่พบ AI_API_KEY)");
  }

  const baseUrl = (process.env.AI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

  const headers: Record<string, string> = {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    // OpenRouter attribution headers — harmless on other OpenAI-compatible endpoints.
    "X-Title": APP_TITLE,
  };
  const appUrl = process.env.AI_APP_URL?.trim();
  if (appUrl) headers["HTTP-Referer"] = appUrl;

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiError("เรียกบริการ AI ไม่สำเร็จ (หมดเวลา 30 วินาที)");
    }
    throw new AiError("เชื่อมต่อบริการ AI ไม่สำเร็จ");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const excerpt = text.slice(0, 200);
    throw new AiError(
      `เรียกบริการ AI ไม่สำเร็จ (HTTP ${response.status})${excerpt ? `: ${excerpt}` : ""}`,
    );
  }

  const data: unknown = await response.json().catch(() => null);
  const content = extractContent(data);
  if (content === null) {
    throw new AiError("ผลลัพธ์จาก AI ไม่มีเนื้อหาให้อ่านได้");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(content));
  } catch {
    throw new AiError("ผลลัพธ์จาก AI ไม่ใช่ JSON ที่ถูกต้อง");
  }

  let result: T | null;
  try {
    result = parse(parsed);
  } catch {
    result = null;
  }
  if (result === null) {
    throw new AiError("ผลลัพธ์จาก AI ไม่อยู่ในรูปแบบที่ระบบคาดหวัง");
  }
  return result;
}
