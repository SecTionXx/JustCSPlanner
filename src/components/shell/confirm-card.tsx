import * as React from "react"

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
 * Tinted-lavender panel with a white inner bubble and three actions.
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
        "rounded-[12px] border p-3.5",
        className
      )}
      style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" }}
    >
      <strong
        className="block text-sm font-bold"
        style={{ color: "#5937c4" }}
      >
        {title}
      </strong>
      <div className="mt-2.5 rounded-[10px] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-foreground">
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
          className="h-8 rounded-[7px] px-2.5 text-xs font-bold text-[#6d28d9] hover:bg-[#eee9ff]"
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
