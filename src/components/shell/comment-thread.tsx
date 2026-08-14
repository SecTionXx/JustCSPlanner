import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Comment {
  id: string
  author: string
  time: string
  body: React.ReactNode
}

export interface CommentThreadProps {
  comments: Comment[]
  /** label for the add-comment button */
  addLabel?: string
  onAdd?: () => void
  className?: string
}

/**
 * Vertical thread of chat bubbles + a full-width add-comment button.
 */
export function CommentThread({
  comments,
  addLabel = "เพิ่มคอมเมนต์",
  onAdd,
  className,
}: CommentThreadProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col gap-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-[9px] bg-muted px-2.5 py-2.5 text-xs leading-relaxed text-foreground"
          >
            <div className="mb-1 text-[11px] font-bold text-primary">
              {comment.author} · {comment.time}
            </div>
            <div>{comment.body}</div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="mt-2 h-9 w-full rounded-[9px] font-semibold"
      >
        <Plus aria-hidden className="size-3.5" />
        {addLabel}
      </Button>
    </div>
  )
}
