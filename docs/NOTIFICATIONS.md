# Notifications

The app fans out each notification to every **registered** channel via
`notify()` (`src/lib/notify.ts`). The in-app channel is always on; the email
and LINE channels are **strictly opt-in** — they register only when their env
vars are present, so a deployment with no external credentials stays
in-app-only and never breaks.

See `.env.example` for the full variable list.

## Channels

| Channel   | Registered when                    | Recipient resolution                          |
| --------- | ---------------------------------- | --------------------------------------------- |
| in-app    | Always                             | `recipientCsId` → Notifications row (repository) |
| email     | `RESEND_API_KEY` is set            | `recipientCsId` → team member `email` (via `listTeam()`); skipped when no email |
| line      | `LINE_CHANNEL_ACCESS_TOKEN` is set | Single configured target (`LINE_TARGET_ID`) — broadcast to the CS team |

Email and LINE `deliver()` never throw. Missing creds, a member without an
email, or an API error all return a failed result that is logged (non-production)
and swallowed — the in-app channel and other recipients are unaffected.

## Enabling email (Resend)

1. Sign up at <https://resend.com> and create a project.
2. Verify the sending domain you will send from (DNS records in the Resend dashboard).
3. Generate an API key (starts with `re_`).
4. In `.env.local` set:
   ```env
   RESEND_API_KEY=re_your_key
   NOTIFY_EMAIL_FROM=onboarding@yourdomain.com
   ```
5. Ensure each `TeamMember` that should receive email has an `email` value (Team tab).

The from address must be on a verified domain. You may use a display name:
`Just CS Planner <onboarding@yourdomain.com>`.

## Enabling LINE

1. Create a LINE Official Account for the bot (LINE Developers console).
2. Issue a **channel access token** (long-lived) for the Messaging API.
3. Determine the **target id** — the user/group/room id the bot will push to.
   (Use the webhook or the profile API to obtain a user id; for a group, use the
   group id returned when the bot joins.)
4. In `.env.local` set:
   ```env
   LINE_CHANNEL_ACCESS_TOKEN=your_token
   LINE_TARGET_ID=Uxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

> **First cut:** LINE sends every notification to the single configured
> `LINE_TARGET_ID`. Per-user LINE targeting is a planned enhancement; today the
> broadcast is intended for a shared CS-team chat.

The channel uses the Push Message API
(`POST https://api.line.me/v2/bot/message/push`), which requires a paid
LINE Official Account plan (push messages are not available on the free tier).

## Disabling a channel

Remove the relevant env var (or leave it unset) and restart the app. The
channel will not be registered; the in-app channel continues to work.
