// =============================================================================
// notify-new-signup — PURE CORE LOGIC (no I/O, no Deno/Node globals at import)
// -----------------------------------------------------------------------------
// This module holds every decision the Edge Function makes: webhook-secret
// verification, payload parsing, redacted email building, and the exactly-once
// orchestration. It has NO network/database/runtime dependencies — those are
// injected — so it can run unchanged in Deno (the Edge Function) AND be unit
// tested in Node/Vitest. Keeping the logic here means the deployed function and
// the tests exercise the SAME code, with zero drift.
//
// SECURITY: this file must never read, build, or emit passwords, access/refresh
// tokens, Stripe/payment data, secret keys, or any uploaded music/playlist data.
// The email is assembled from an explicit allow-list of fields only.
// =============================================================================

/** The subset of a `public.profiles` row we accept from the DB webhook. */
export interface SignupRecord {
  /** Supabase auth user id (profiles.id references auth.users.id). */
  id: string
  email: string
  /** May be empty string per the profile trigger default. */
  fullName: string
  /** ISO timestamp of account/profile creation. */
  createdAt: string
}

/** Shape of a Supabase Database Webhook payload for an INSERT on profiles. */
export interface SignupWebhookPayload {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

export type SignupOutcome =
  | 'sent' // a new notification was sent
  | 'duplicate' // already notified for this user id — skipped (idempotent)
  | 'unauthorized' // webhook secret missing/incorrect
  | 'ignored' // not an INSERT we care about, or unparseable record
  | 'send_failed' // claimed but the email provider failed — retryable

export interface ProcessResult {
  /** HTTP status the Edge Function should return to Supabase. */
  httpStatus: number
  outcome: SignupOutcome
  /** Safe, secret-free message for logs / response body. */
  message: string
}

/** The exact subject line required by the spec. */
export const SIGNUP_EMAIL_SUBJECT = 'New EQHO Player signup'

/**
 * Constant-time string comparison to avoid leaking the secret via timing.
 * Uses TextEncoder, which exists as a global in both Deno and Node 18+.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Length mismatch can't be constant-time hidden, but still avoid early return
  // patterns that reveal prefix matches.
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

/**
 * Verify the shared webhook secret. Both the configured secret and the provided
 * header must be non-empty and equal. A missing configured secret fails closed.
 */
export function verifyWebhookSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!expected || !provided) return false
  return constantTimeEqual(provided, expected)
}

/** HTML-escape a string so record values can never inject markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Pull ONLY the allow-listed fields out of the webhook record. Returns null when
 * this isn't an INSERT of a usable profile row (so we ignore it rather than
 * emailing garbage or retrying forever). Deliberately does not copy any other
 * field, so tokens/secrets present elsewhere can never leak into an email.
 */
export function extractSignupRecord(
  payload: SignupWebhookPayload | null | undefined,
): SignupRecord | null {
  if (!payload || typeof payload !== 'object') return null
  // Only care about row insertions.
  if (payload.type && payload.type !== 'INSERT') return null
  const record = payload.record
  if (!record || typeof record !== 'object') return null

  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const email = typeof record.email === 'string' ? record.email.trim() : ''
  if (!id || !email) return null

  const fullNameRaw = typeof record.full_name === 'string' ? record.full_name.trim() : ''
  const createdAtRaw = typeof record.created_at === 'string' ? record.created_at : ''

  return {
    id,
    email,
    fullName: fullNameRaw,
    createdAt: createdAtRaw,
  }
}

/** Format an ISO timestamp for humans; fall back gracefully if unparseable. */
export function formatCreatedAt(createdAt: string): string {
  if (!createdAt) return 'Unknown'
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return createdAt
  // e.g. "28 August 2026, 14:03 UTC"
  return (
    d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false,
    }) + ' UTC'
  )
}

/**
 * Build the owner notification email from the allow-listed fields ONLY.
 * Contains: customer name, customer email, Supabase user id, creation date/time.
 */
export function buildSignupEmail(record: SignupRecord): BuiltEmail {
  const name = record.fullName || 'Not provided'
  const created = formatCreatedAt(record.createdAt)

  const text = [
    'A new EQHO Player account has been created.',
    '',
    `Name:        ${name}`,
    `Email:       ${record.email}`,
    `User ID:     ${record.id}`,
    `Created at:  ${created}`,
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff4fa3, #ff8a00); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 18px;">New EQHO Player signup</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 16px;">A new EQHO Player account has been created.</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Name</td><td style="padding: 6px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;">${escapeHtml(record.email)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">User ID</td><td style="padding: 6px 0; font-family: monospace;">${escapeHtml(record.id)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Created</td><td style="padding: 6px 0;">${escapeHtml(created)}</td></tr>
        </table>
      </div>
    </div>
  `.trim()

  return { subject: SIGNUP_EMAIL_SUBJECT, html, text }
}

/** Injected side-effecting dependencies — real in Deno, mocked in tests. */
export interface ProcessDeps {
  /** Raw secret from the incoming request header. */
  providedSecret: string | null | undefined
  /** Configured secret (SIGNUP_WEBHOOK_SECRET). */
  expectedSecret: string | null | undefined
  /** Parsed JSON webhook body. */
  payload: SignupWebhookPayload | null | undefined
  /**
   * Atomically claim the notification for this user id. Must return true only
   * the FIRST time it's called for a given id (backed by a unique/PK insert),
   * and false on every subsequent call — this is what guarantees exactly-once.
   */
  claim: (userId: string) => Promise<boolean>
  /**
   * Release a previously-made claim so a later webhook retry can re-attempt the
   * send. Called only when the email provider failed after a successful claim.
   */
  release: (userId: string) => Promise<void>
  /** Send the built email. Must throw on provider failure. */
  sendEmail: (record: SignupRecord, email: BuiltEmail) => Promise<void>
  /** Secret-free structured logger. */
  log?: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void
}

/**
 * Orchestrate a single webhook delivery with exactly-once semantics:
 *   1. Verify the shared secret (fail closed with 401, no processing).
 *   2. Parse + allow-list the record (ignore anything that isn't a usable insert).
 *   3. Claim by user id — a duplicate delivery/retry short-circuits here (200).
 *   4. Send the email; on failure release the claim and return 500 so Supabase
 *      retries later. On success return 200.
 *
 * The customer's signup already committed before this runs (DB webhook fires
 * after the profiles insert), so any outcome here — including total failure —
 * never affects account creation or use.
 */
export async function processSignupWebhook(deps: ProcessDeps): Promise<ProcessResult> {
  const log = deps.log ?? (() => {})

  if (!verifyWebhookSecret(deps.providedSecret, deps.expectedSecret)) {
    log('warn', 'Rejected webhook: missing or invalid shared secret')
    return { httpStatus: 401, outcome: 'unauthorized', message: 'Unauthorized' }
  }

  const record = extractSignupRecord(deps.payload)
  if (!record) {
    log('info', 'Ignored webhook: not a usable profile INSERT')
    // 200 so Supabase does not retry a payload we will never act on.
    return { httpStatus: 200, outcome: 'ignored', message: 'Ignored (no actionable record)' }
  }

  // Exactly-once gate: only the first delivery for this user id wins the claim.
  let claimed = false
  try {
    claimed = await deps.claim(record.id)
  } catch (err) {
    log('error', 'Idempotency claim failed', { userId: record.id, error: safeError(err) })
    // Treat as retryable so we don't silently drop a genuine signup.
    return { httpStatus: 500, outcome: 'send_failed', message: 'Claim failed' }
  }

  if (!claimed) {
    log('info', 'Duplicate delivery suppressed', { userId: record.id })
    return { httpStatus: 200, outcome: 'duplicate', message: 'Already notified' }
  }

  const email = buildSignupEmail(record)
  try {
    await deps.sendEmail(record, email)
  } catch (err) {
    // Roll back the claim so a webhook retry can try again later.
    try {
      await deps.release(record.id)
    } catch (releaseErr) {
      log('error', 'Failed to release claim after send failure', {
        userId: record.id,
        error: safeError(releaseErr),
      })
    }
    log('error', 'Email send failed', { userId: record.id, error: safeError(err) })
    return { httpStatus: 500, outcome: 'send_failed', message: 'Send failed' }
  }

  log('info', 'Owner notification sent', { userId: record.id })
  return { httpStatus: 200, outcome: 'sent', message: 'Notification sent' }
}

/**
 * Reduce an unknown thrown value to a short, secret-free string. Never returns
 * request bodies, headers, or provider payloads that could contain tokens.
 */
export function safeError(err: unknown): string {
  if (err instanceof Error) return err.name + (err.message ? `: ${err.message.slice(0, 200)}` : '')
  if (typeof err === 'string') return err.slice(0, 200)
  return 'Unknown error'
}
