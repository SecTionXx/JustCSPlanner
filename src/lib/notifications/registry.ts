// Channel registry — builds the active channel list.
// In-app is always on. Email/LINE channels are gated on their env vars and will
// be implemented in P2.1; they are intentionally not registered yet.

import "server-only";

import { inAppChannel } from "./in-app-channel";
import type { NotifyChannel } from "./types";

/**
 * Return the list of channels active for this deployment. Memoised per-request
 * is unnecessary — this is a cheap array built from already-imported modules.
 */
export function getChannels(): NotifyChannel[] {
  const channels: NotifyChannel[] = [inAppChannel];

  // P2.1: register email/LINE channels when their env vars exist, e.g.
  //   if (process.env.SMTP_HOST) channels.push(emailChannel);
  //   if (process.env.LINE_CHANNEL_TOKEN) channels.push(lineChannel);

  return channels;
}
