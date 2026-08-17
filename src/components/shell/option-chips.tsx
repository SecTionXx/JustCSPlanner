"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface ChipOption {
  value: string
  label: string
}

export interface OptionChipsProps {
  options: ChipOption[]
  /** selected value (single mode) */
  value?: string
  /** selected values (multi mode) */
  values?: string[]
  onChange?: (selected: string | string[]) => void
  allowMultiple?: boolean
  className?: string
}

/**
 * Selector chips for form fields (e.g. Shipment Type FCL / LCL / Air).
 * Selected chip = primary bg + primary-foreground.
 */
export function OptionChips({
  options,
  value,
  values,
  onChange,
  allowMultiple = false,
  className,
}: OptionChipsProps): React.ReactElement {
  const selectedSet = React.useMemo(() => {
    if (allowMultiple) {
      return new Set(values ?? [])
    }
    return new Set(value !== undefined ? [value] : [])
  }, [allowMultiple, value, values])

  const toggle = (optionValue: string): void => {
    if (allowMultiple) {
      const next = new Set(selectedSet)
      if (next.has(optionValue)) {
        next.delete(optionValue)
      } else {
        next.add(optionValue)
      }
      onChange?.(Array.from(next))
      return
    }
    onChange?.(optionValue)
  }

  return (
    <div className={cn("flex flex-wrap gap-[7px]", className)}>
      {options.map((option) => {
        const selected = selectedSet.has(option.value)
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => toggle(option.value)}
            className={cn(
              "cursor-pointer rounded-[7px] border px-[9px] py-1.5 text-xs leading-none transition-colors",
              selected
                ? "border-primary bg-secondary font-bold text-secondary-foreground"
                : "border-input bg-transparent text-foreground hover:bg-muted"
            )}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
