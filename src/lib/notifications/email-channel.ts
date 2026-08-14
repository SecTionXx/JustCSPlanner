// Email notification channel — sends via Resend. Registered ONLY when
// RESEND_API_KEY is present (see registry.ts). Resolves the recipient csId to an
// email address via the team list; skips gracefully when the member has no email.
// Never throws — per-delivery failures are caught and logged.

import "server-only";

import { Resend } from "resend";

import { getRepository } from "../repository";
import type { NotifyChannel } from "./types";

/**
 * Email channel using Resend. The channel object is cheap to keep around; the
 * Resend client and env reads happen at deliver() time so serverless cold starts
 * and env rotation are handled without restarts.
 */
export const emailChannel: NotifyChannel = {
  key: "email",
  async deliver(input) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.NOTIFY_EMAIL_FROM;
      // Defensive: registry gates registration on RESEND_API_KEY, but a missing
      // NOTIFY_EMAIL_FROM means we cannot send — treat as a graceful skip.
      if (!apiKey || !from) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[notify][email] RESEND_API_KEY or NOTIFY_EMAIL_FROM not set; skipping",
          );
        }
        return { status: "failed" };
      }

      // Resolve recipient csId → email. A per-deliver listTeam() call is
      // acceptable at the expected low notification volume.
      const team = await getRepository().listTeam();
      const member = team.find((m) => m.csId === input.recipientCsId);
      const to = member?.email;
      if (!to) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[notify][email] no email address for csId "${input.recipientCsId}"; skipping`,
          );
        }
        return { status: "failed" };
      }

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: [to],
        subject: input.subject,
        text: input.body,
      });

      if (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[notify][email] Resend returned an error", error);
        }
        return { status: "failed" };
      }

      return { status: "sent" };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[notify][email] delivery failed", error);
      }
      return { status: "failed" };
    }
  },
};
