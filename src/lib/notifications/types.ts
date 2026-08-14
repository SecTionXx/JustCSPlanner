// Channel system types. A channel knows how to deliver one notification to one
// recipient. The notify() dispatcher fans out to every registered channel.
// In-app is always on; email/LINE are registered only when their env vars exist
// (implemented in P2.1).

import type { ActivityEvent } from "../enums";

/** Payload handed to a channel's deliver(). */
export interface DeliverInput {
  recipientCsId: string;
  event: ActivityEvent;
  subject: string;
  body: string;
  jobId?: string;
}

/** Outcome of a single delivery attempt. */
export interface DeliverResult {
  status: "sent" | "failed";
}

/** A pluggable notification channel (in-app, email, LINE, ...). */
export interface NotifyChannel {
  /** Stable channel key, matching Notifications.channel values. */
  key: string;
  /** Deliver one notification to one recipient. Never throws — returns failed. */
  deliver(input: DeliverInput): Promise<DeliverResult>;
}
