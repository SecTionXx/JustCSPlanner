// POST /api/email-inbound — webhook that drops an inbound email into the
// EmailInbox staging sheet (source: "webhook"). Body: { from, subject, body? }.
//
// Protected by INBOUND_SECRET — send it either as
//   Authorization: Bearer <INBOUND_SECRET>   or   ?secret=<INBOUND_SECRET>
// When INBOUND_SECRET is unset the endpoint warns and still accepts requests
// in development only (same pattern as the cron routes); in production it
// refuses to run unauthenticated.

import { NextResponse } from "next/server";

import { getRepository } from "@/lib/repository";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.INBOUND_SECRET?.trim();
  if (secret) {
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret")?.trim();
    const header = request.headers.get("authorization") ?? "";
    const bearer = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (bearer !== secret && querySecret !== secret) {
      return jsonError("Unauthorized (INBOUND_SECRET ไม่ถูกต้อง)", 401);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[api/email-inbound] INBOUND_SECRET is not set — accepting unauthenticated request (dev only)",
    );
  } else {
    return jsonError(
      "INBOUND_SECRET ยังไม่ได้ตั้งค่า — ปฏิเสธคำขอใน production (ตั้งค่าใน .env.local)",
      500,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("รูปแบบคำขอไม่ถูกต้อง (ต้องเป็น JSON)", 400);
  }

  const from =
    isRecord(payload) && typeof payload.from === "string" ? payload.from.trim() : "";
  const subject =
    isRecord(payload) && typeof payload.subject === "string" ? payload.subject.trim() : "";
  const body =
    isRecord(payload) && typeof payload.body === "string" ? payload.body.trim() : "";

  if (!from || !subject) {
    return jsonError("กรุณาระบุผู้ส่ง (from) และหัวเรื่อง (subject)", 400);
  }

  const email = await getRepository().appendEmail({
    fromAddress: from,
    subject,
    body: body || undefined,
    source: "webhook",
  });

  return NextResponse.json({ ok: true, emailId: email.emailId }, { status: 201 });
}
