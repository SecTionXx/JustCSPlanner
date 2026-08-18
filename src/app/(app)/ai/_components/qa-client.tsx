"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentUser } from "@/lib/types";

import { askAi } from "../actions";

/** Quick prompts — fill the input only; the user still presses "ถาม". */
const QUICK_QUESTIONS = [
  "งานใกล้ deadline วันนี้มีอะไรบ้าง",
  "ใครมีงานเกินกำหนดบ้าง",
  "สรุปงานที่รอลูกค้าอยู่",
] as const;

/** Mirrors MAX_QUESTION_LENGTH in ../actions (kept in sync manually). */
const MAX_QUESTION_LENGTH = 1000;

export interface QaClientProps {
  currentUser: CurrentUser;
}

/**
 * Ask-a-question form for the /ai page. Calls the askAi server action and
 * renders the Thai answer (or error) inline. Answers are grounded only in the
 * minimized job projection built server-side — nothing else is sent.
 */
export function QaClient({ currentUser }: QaClientProps): React.ReactElement {
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleAsk(): void {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    startTransition(() => {
      askAi(trimmed, currentUser)
        .then((result) => {
          if (!result.enabled) {
            setAnswer("");
            setError("ฟีเจอร์ AI ปิดอยู่ — ตั้งค่า AI_API_KEY เพื่อเปิดใช้งาน");
            return;
          }
          if (result.error) {
            setAnswer("");
            setError(result.error);
            return;
          }
          setError("");
          setAnswer(result.answer ?? "");
        })
        .catch(() => {
          setAnswer("");
          setError("เรียกบริการ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-[7px]">
        {QUICK_QUESTIONS.map((quick) => (
          <button
            type="button"
            key={quick}
            disabled={pending}
            onClick={() => setQuestion(quick)}
            className="cursor-pointer rounded-[7px] border px-[9px] py-1.5 text-xs leading-none text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {quick}
          </button>
        ))}
      </div>

      <Textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            handleAsk();
          }
        }}
        placeholder="พิมพ์คำถามเกี่ยวกับงานของทีม เช่น งานไหนเกินกำหนดแล้วบ้าง"
        maxLength={MAX_QUESTION_LENGTH}
        disabled={pending}
        className="min-h-[70px] rounded-[9px] text-sm"
        aria-label="คำถามเกี่ยวกับงาน"
      />

      <div className="flex items-center justify-end">
        <Button
          type="button"
          size="lg"
          disabled={!question.trim() || pending}
          onClick={handleAsk}
          className="rounded-[9px] text-sm font-bold"
        >
          {pending ? "กำลังถาม…" : "ถาม"}
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[9px] border border-destructive/30 bg-card px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="rounded-[9px] border bg-card px-3 py-3 text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {answer}
        </div>
      ) : null}
    </div>
  );
}
