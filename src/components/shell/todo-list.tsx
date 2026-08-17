"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface TodoItem {
  id: string
  title: React.ReactNode
  done: boolean
}

export interface TodoListProps {
  items: TodoItem[]
  onToggle?: (id: string) => void
  /** slot for the "+ เพิ่ม To-do" affordance */
  children?: React.ReactNode
  className?: string
}

/**
 * Checklist of todos with a checkbox row each.
 * An add slot (`children`) renders at the bottom.
 */
export function TodoList({
  items,
  onToggle,
  children,
  className,
}: TodoListProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 border-t border-border py-2 first:border-t-0 first:pt-0"
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={() => onToggle?.(item.id)}
              className="size-[17px] rounded-[5px] data-checked:border-status-completed data-checked:bg-status-completed"
            />
            <span
              className={cn(
                "text-[13px] leading-snug",
                item.done && "text-muted-foreground line-through"
              )}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  )
}
