// Output contracts for AI features + hand-rolled validators (no zod — keep
// dependencies at zero). Shapes follow the implementation guide §8.3 exactly.
// Validators coerce primitives (string/number/boolean → string), treat
// null/undefined as "missing", and return null on any real shape mismatch —
// callers turn null into a graceful "cannot draft" path, never a crash.

/** AI extraction result for a booking/job message — impl guide §8.3. */
export interface JobDraft {
  customer: string;
  booking_number: string;
  shipment_type: string;
  origin: string;
  destination: string;
  deadline: string;
  summary: string;
  suggested_todos: string[];
  missing_information: string[];
  confidence: "low" | "medium" | "high";
}

/** AI answer for the job Q&A feature. */
export interface JobAnswer {
  answer: string;
  /** True when the answer was cut to stay within a length cap. */
  capped?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Coerce one field to a string. null/undefined → "" (missing); primitives →
 * string; anything else → null (shape mismatch).
 */
function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

/**
 * Coerce one field to a string array. null/undefined → []; every item must be
 * coercible to a non-empty string; otherwise null (shape mismatch).
 */
function stringArray(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const items: string[] = [];
  for (const item of value) {
    const coerced = optionalString(item);
    if (coerced === null) return null;
    if (coerced !== "") items.push(coerced);
  }
  return items;
}

/**
 * Confidence must be low|medium|high. Missing/invalid falls back to "low" —
 * impl guide §8.5: when unsure, lower confidence so a human reviews carefully.
 */
function coerceConfidence(value: unknown): JobDraft["confidence"] {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "high" || normalized === "medium" || normalized === "low") {
      return normalized;
    }
  }
  return "low";
}

/**
 * Validate an unknown payload as a JobDraft (§8.3). Returns a fully-populated
 * draft (missing fields as "" / []) or null when the shape does not match.
 * Note: value-conformance for shipment_type against the system enums is the
 * caller's confirmation step (guide §8.4 step 3) — this checks shape only.
 */
export function validateJobDraft(raw: unknown): JobDraft | null {
  if (!isRecord(raw)) return null;

  const customer = optionalString(raw.customer);
  const bookingNumber = optionalString(raw.booking_number);
  const shipmentType = optionalString(raw.shipment_type);
  const origin = optionalString(raw.origin);
  const destination = optionalString(raw.destination);
  const deadline = optionalString(raw.deadline);
  const summary = optionalString(raw.summary);
  const suggestedTodos = stringArray(raw.suggested_todos);
  const missingInformation = stringArray(raw.missing_information);

  if (
    customer === null ||
    bookingNumber === null ||
    shipmentType === null ||
    origin === null ||
    destination === null ||
    deadline === null ||
    summary === null ||
    suggestedTodos === null ||
    missingInformation === null
  ) {
    return null;
  }

  return {
    customer,
    booking_number: bookingNumber,
    shipment_type: shipmentType,
    origin,
    destination,
    deadline,
    summary,
    suggested_todos: suggestedTodos,
    missing_information: missingInformation,
    confidence: coerceConfidence(raw.confidence),
  };
}

/**
 * Validate an unknown payload as a JobAnswer. Returns null when `answer` is
 * missing/not coercible to a non-empty string, or `capped` is present but not
 * a boolean.
 */
export function validateJobAnswer(raw: unknown): JobAnswer | null {
  if (!isRecord(raw)) return null;
  const answer = optionalString(raw.answer);
  if (answer === null || answer === "") return null;
  if (raw.capped !== undefined && typeof raw.capped !== "boolean") return null;
  return raw.capped === undefined ? { answer } : { answer, capped: raw.capped };
}
