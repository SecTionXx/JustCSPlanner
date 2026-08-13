// Notification seam — where LINE / Teams / email wiring goes later.
// For now it is a typed console.log in dev. Never throws.

import type { ActivityEvent } from "./enums";

/**
 * Emit a notification for an activity event. No-op for unknown callers in
 * production; logs to console in development. The payload is opaque so each
 * caller can pass the event-specific shape.
 */
export function notify(event: ActivityEvent, payload: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[notify] ${event}`, payload);
  }
}
