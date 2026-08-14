import * as React from "react"

import { cn } from "@/lib/utils"

export interface AttachedFile {
  name: string
  url?: string
}

export interface FileChipsProps {
  files: AttachedFile[]
  /** label for the upload pill */
  uploadLabel?: string
  /** render the (decorative) trailing upload pill. Default true. */
  showUploadPill?: boolean
  className?: string
}

/**
 * List of 📎 filename chips with a trailing upload pill.
 */
export function FileChips({
  files,
  uploadLabel = "+ อัปโหลดไฟล์",
  showUploadPill = true,
  className,
}: FileChipsProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {files.map((file) => {
        const content = (
          <>
            <span aria-hidden className="mr-1">
              📎
            </span>
            {file.name}
          </>
        )
        return file.url ? (
          <a
            key={file.name}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-[7px] bg-[#f5f3fb] px-2.5 py-1 text-xs text-foreground underline-offset-2 hover:underline"
          >
            {content}
          </a>
        ) : (
          <span
            key={file.name}
            className="inline-flex items-center rounded-[7px] bg-[#f5f3fb] px-2.5 py-1 text-xs text-foreground"
          >
            {content}
          </span>
        )
      })}
      {showUploadPill ? (
        <span className="inline-flex items-center rounded-[7px] border border-[#cdebd9] bg-[#e1f7ec] px-2.5 py-1 text-xs font-semibold text-[#177a55]">
          {uploadLabel}
        </span>
      ) : null}
    </div>
  )
}
