import * as React from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ConfirmCardProps {
  title: React.ReactNode
  children: React.ReactNode
  confirmLabel?: string
  editLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onEdit?: () => void
  onCancel?: () => void
  className?: string
}

/**
 * Reusable "AI draft → confirm" primitive (UI only, no AI logic).
 * Primary-tinted panel with a card inner bubble and three actions.
 * Implements the "AI proposes, human confirms" design rule.
 */
export function ConfirmCard({
  title,
  children,
  confirmLabel = "ยืนยัน",
  editLabel = "แก้ไข",
  cancelLabel = "ยกเลิก",
  onConfirm,
  onEdit,
  onCancel,
  className,
}: ConfirmCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-primary/30 bg-secondary/60 p-3.5",
        className
      )}
    >
      <strong className="flex items-center gap-1.5 text-sm font-bold text-primary">
        <Sparkles aria-hidden className="size-4 shrink-0" />
        {title}
      </strong>
      <div className="mt-2.5 rounded-[10px] bg-card px-3 py-2.5 text-[13px] leading-relaxed text-card-foreground">
        {children}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={onConfirm}
          className="h-8 rounded-[7px] px-2.5 text-xs font-bold"
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onEdit}
          className="h-8 rounded-[7px] px-2.5 text-xs font-bold text-primary hover:bg-secondary"
        >
          {editLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-8 rounded-[7px] px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
