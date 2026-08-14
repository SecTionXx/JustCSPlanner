// Heuristic job-match suggestion (no AI) for the email inbox.
// Best-effort only — used to preselect the job <select>:
//   1) booking-number substring found in the email text (most specific)
//   2) exact customer name found in the email text
// Pure function, case-insensitive; returns undefined when nothing matches.

import type { EmailInbox } from "@/lib/types";

/** Minimal job shape needed for matching (JobCard satisfies this). */
export interface SuggestJobLike {
  jobId: string;
  customer: string;
  bookingNumber?: string;
}

/** Minimum booking-number length worth matching on (guards tiny/false tokens). */
const MIN_BOOKING_LENGTH = 3;

export function suggestJobId(
  email: Pick<EmailInbox, "fromAddress" | "subject" | "body">,
  jobs: SuggestJobLike[],
): string | undefined {
  const haystack = `${email.subject}\n${email.body ?? ""}`.toLowerCase();

  for (const job of jobs) {
    const booking = job.bookingNumber?.trim().toLowerCase();
    if (booking && booking.length >= MIN_BOOKING_LENGTH && haystack.includes(booking)) {
      return job.jobId;
    }
  }

  for (const job of jobs) {
    const customer = job.customer.trim().toLowerCase();
    if (customer && haystack.includes(customer)) {
      return job.jobId;
    }
  }

  return undefined;
}
