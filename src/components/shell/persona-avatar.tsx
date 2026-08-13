import * as React from "react"

import { cn } from "@/lib/utils"

export type PersonaAvatarSize = "sm" | "md"

export interface PersonaAvatarProps {
  name: string
  size?: PersonaAvatarSize
  className?: string
}

/**
 * Derive a 2-letter initials token from a name.
 * Takes the first letter of the first two whitespace-separated words.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) {
    const word = parts[0]
    return word.slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Small initials circle used across the CS team views.
 */
export function PersonaAvatar({
  name,
  size = "md",
  className,
}: PersonaAvatarProps): React.ReactElement {
  const dims =
    size === "sm" ? "size-[22px] text-[10px]" : "size-[27px] text-[11px]"

  return (
    <span
      aria-label={name}
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none",
        dims,
        className
      )}
      style={{ backgroundColor: "#e9e3ff", color: "#6345c3" }}
    >
      {initialsOf(name)}
    </span>
  )
}
