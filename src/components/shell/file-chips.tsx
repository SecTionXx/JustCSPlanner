import * as React from "react"
import { Paperclip, Plus } from "lucide-react"

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
 * Only http(s) and site-relative URLs become links — a chip whose URL came
 * from stored data (docLinks, attachments) must never be a javascript:/data:
 * vector once the data source is user-controlled (Sheets adapter).
 */
const SAFE_URL_RE = /^(https?:\/\/|\/)/i

function isSafeUrl(url: string): boolean {
  return SAFE_URL_RE.test(url.trim())
}

/**
 * List of filename chips with a trailing upload pill.
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
            <Paperclip aria-hidden className="mr-1 inline size-3 -translate-y-px" />
            {file.name}
          </>
        )
        return file.url && isSafeUrl(file.url) ? (
          <a
            key={file.name}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-[7px] bg-muted px-2.5 py-1 text-xs text-foreground underline-offset-2 hover:underline"
          >
            {content}
          </a>
        ) : (
          <span
            key={file.name}
            className="inline-flex items-center rounded-[7px] bg-muted px-2.5 py-1 text-xs text-foreground"
          >
            {content}
          </span>
        )
      })}
      {showUploadPill ? (
        <span className="inline-flex items-center rounded-[7px] border border-status-completed/30 bg-status-completed-soft px-2.5 py-1 text-xs font-semibold text-status-completed">
          <Plus aria-hidden className="mr-0.5 inline size-3" />
          {uploadLabel}
        </span>
      ) : null}
    </div>
  )
}
