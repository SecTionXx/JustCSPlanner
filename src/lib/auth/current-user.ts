// Mock auth seam. No real authentication — returns a dev-defined current user.
// Later this becomes a session/cookie-backed lookup; pages and repositories
// only depend on the returned CurrentUser shape.

import type { CurrentUser } from "../types";

/**
 * Dev-only users surfaced for a future role-switcher. Keys are csIds matching
 * the mock Team sheet. Values are the CurrentUser shape (no email/active).
 */
export const DEV_USERS: Record<string, CurrentUser> = {
  jantana: { csId: "jantana", displayName: "จันทนา", role: "lead" },
  aom: { csId: "aom", displayName: "อ้อม", role: "cs_owner" },
  may: { csId: "may", displayName: "เม", role: "cs_owner" },
  nina: { csId: "nina", displayName: "นินา", role: "cs_assistant" },
  somchai: { csId: "somchai", displayName: "สมชาย", role: "requester" },
};

const DEFAULT_CS_ID = "jantana";

/**
 * Return the current user. Defaults to the team lead (Jantana) for the mock.
 */
export function getCurrentUser(): CurrentUser {
  return DEV_USERS[DEFAULT_CS_ID];
}

/**
 * Dev role-switcher stub. In-memory only for the mock data layer; real auth
 * will replace this with a session write. Currently a no-op placeholder so the
 * UI can call it without breaking.
 */
export function setCurrentUserForDev(csId: string): void {
  // Intentionally a no-op for now. A future dev-only cookie/session can be set
  // here so the role switcher in the UI actually changes getCurrentUser().
  void csId;
}
