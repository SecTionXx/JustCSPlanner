// Mock auth seam. No real authentication — returns a dev-defined current user.
// The active dev user is stored in a `dev_user` cookie (csId). Pages and
// repositories only depend on the returned CurrentUser shape.
//
// NOTE: the cookie is WRITTEN by the `switchDevUser` server action in
// `src/app/(app)/actions.ts` (server actions must live in a "use server" file,
// which this module is not — it exports the DEV_USERS object). This module only
// READS the cookie.

import "server-only";

import { cookies } from "next/headers";

import type { CurrentUser } from "../types";

/**
 * Dev-only users surfaced for the role-switcher. Keys are csIds matching the
 * mock Team sheet. Values are the CurrentUser shape (no email/active).
 */
export const DEV_USERS: Record<string, CurrentUser> = {
  jantana: { csId: "jantana", displayName: "จันทนา", role: "lead" },
  aom: { csId: "aom", displayName: "อ้อม", role: "cs_owner" },
  may: { csId: "may", displayName: "เม", role: "cs_owner" },
  nina: { csId: "nina", displayName: "นินา", role: "cs_assistant" },
  somchai: { csId: "somchai", displayName: "สมชาย", role: "requester" },
  pan: { csId: "pan", displayName: "แพน", role: "admin" },
};

const DEFAULT_CS_ID = "jantana";
const DEV_USER_COOKIE = "dev_user";

/**
 * Return the current user, resolved from the `dev_user` cookie. Defaults to the
 * team lead (Jantana) when the cookie is unset or references an unknown user.
 * Async because Next 16's `cookies()` is async.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const store = await cookies();
  const csId = store.get(DEV_USER_COOKIE)?.value;
  if (csId && DEV_USERS[csId]) {
    return DEV_USERS[csId];
  }
  return DEV_USERS[DEFAULT_CS_ID];
}
