// Channel registry — builds the active channel list.
// In-app is always on. Email (Resend) and LINE channels are strictly opt-in:
// they are registered only when their env vars are present, so a deployment
// with no external creds stays in-app-only and never breaks.

import "server-only";

import { emailChannel } from "./email-channel";
import { inAppChannel } from "./in-app-channel";
import { lineChannel } from "./line-channel";
import type { NotifyChannel } from "./types";

/**
 * Return the list of channels active for this deployment. Env is read at call
 * time so config changes apply without a restart. Cheap array build from
 * already-imported modules — no memoisation needed.
 */
export function getChannels(): NotifyChannel[] {
  const channels: NotifyChannel[] = [inAppChannel];

  if (process.env.RESEND_API_KEY) {
    channels.push(emailChannel);
  }

  if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    channels.push(lineChannel);
  }

  return channels;
}
