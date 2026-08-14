// LINE notification channel — pushes a text message via the LINE Messaging API.
// Registered ONLY when LINE_CHANNEL_ACCESS_TOKEN is present (see registry.ts).
// First cut: a single configured target (LINE_TARGET_ID) that broadcasts to the
// CS team. Per-user LINE targeting is a later enhancement. Never throws —
// failures and missing creds are caught and logged.

import "server-only";

import type { NotifyChannel } from "./types";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** Build the message text sent to LINE (subject + body). */
function buildMessageText(subject: string, body: string): string {
  return body ? `${subject}\n${body}` : subject;
}

/**
 * LINE channel. Reads creds at deliver() time so config changes are picked up
 * without a restart. When creds are absent it no-ops gracefully (it should not
 * even be registered, but the check is defensive).
 */
export const lineChannel: NotifyChannel = {
  key: "line",
  async deliver(input) {
    try {
      const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const targetId = process.env.LINE_TARGET_ID;
      if (!accessToken || !targetId) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[notify][line] LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_ID not set; skipping",
          );
        }
        return { status: "failed" };
      }

      const response = await fetch(LINE_PUSH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: targetId,
          messages: [
            {
              type: "text",
              text: buildMessageText(input.subject, input.body),
            },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[notify][line] push failed: ${response.status} ${response.statusText}`,
            detail,
          );
        }
        return { status: "failed" };
      }

      return { status: "sent" };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[notify][line] delivery failed", error);
      }
      return { status: "failed" };
    }
  },
};
