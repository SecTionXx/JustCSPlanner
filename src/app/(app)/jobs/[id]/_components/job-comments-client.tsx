"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { CommentThread, type Comment } from "@/components/shell";

import { addComment } from "../../../actions";

export interface JobCommentsClientProps {
  jobId: string;
  comments: Comment[];
}

/**
 * Renders the note/comment thread and an inline composer. Submitting calls the
 * addComment server action; the new comment appears after revalidation.
 */
export function JobCommentsClient({
  jobId,
  comments,
}: JobCommentsClientProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(): void {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    startTransition(() => {
      addComment(jobId, trimmed)
        .then(() => {
          setText("");
          setOpen(false);
        })
        .catch(() => {
          // keep composer open with text on failure
        });
    });
  }

  if (!open) {
    return (
      <CommentThread
        comments={comments}
        onAdd={() => setOpen(true)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <CommentThread comments={comments} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        placeholder="พิมพ์คอมเมนต์..."
        className="min-h-[70px] w-full rounded-[9px] border bg-white px-3 py-2 text-sm"
       
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          className="rounded-[9px] text-xs font-bold"
        >
          ยกเลิก
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!text.trim() || pending}
          onClick={handleSubmit}
          className="rounded-[9px] text-xs font-bold"
        >
          {pending ? "กำลังส่ง..." : "ส่งคอมเมนต์"}
        </Button>
      </div>
    </div>
  );
}
