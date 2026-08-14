// In-app notification channel — always registered. Persists a Notification row
// via the repository so the bell badge and /notifications page can read it.
// Status is "sent" when the row is written; "failed" if the write throws.

import "server-only";

import { getRepository } from "../repository";
import type { CreateNotificationInput } from "../types";
import type { NotifyChannel } from "./types";

export const inAppChannel: NotifyChannel = {
  key: "in-app",
  async deliver(input) {
    try {
      const repo = getRepository();
      const row: CreateNotificationInput = {
        jobId: input.jobId,
        recipientCsId: input.recipientCsId,
        event: input.event,
        channel: "in-app",
        subject: input.subject,
        body: input.body,
        status: "sent",
      };
      await repo.appendNotification(row);
      return { status: "sent" };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[notify][in-app] delivery failed", error);
      }
      return { status: "failed" };
    }
  },
};
