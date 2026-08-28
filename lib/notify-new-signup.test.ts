import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  processSignupWebhook,
  buildSignupEmail,
  extractSignupRecord,
  verifyWebhookSecret,
  SIGNUP_EMAIL_SUBJECT,
  type SignupWebhookPayload,
  type SignupRecord,
  type BuiltEmail,
} from '@/supabase/functions/notify-new-signup/core'

const SECRET = 'test-shared-secret-value'

// A realistic Supabase Database Webhook payload for INSERT on public.profiles.
// It intentionally also carries fields that MUST NEVER appear in the email, to
// prove the allow-list redaction.
function insertPayload(overrides: Record<string, unknown> = {}): SignupWebhookPayload {
  return {
    type: 'INSERT',
    table: 'profiles',
    schema: 'public',
    record: {
      id: '11111111-2222-3333-4444-555555555555',
      email: 'coach@example.com',
      full_name: 'Alex Coach',
      created_at: '2026-08-28T14:03:00.000Z',
      // Forbidden / sensitive fields that must be ignored:
      password: 'hunter2',
      access_token: 'eyJfake.token',
      refresh_token: 'refresh-abc',
      stripe_customer_id: 'cus_ABC123',
      stripe_subscription_id: 'sub_XYZ789',
      ...overrides,
    },
    old_record: null,
  }
}

/**
 * In-memory harness that mirrors the REAL claim/release semantics of the
 * signup_notifications table (user id = primary key): claim() succeeds only the
 * first time per id; release() removes the marker so a retry can re-claim.
 */
function makeHarness(opts: { failSendTimes?: number } = {}) {
  const claimed = new Set<string>()
  let remainingFailures = opts.failSendTimes ?? 0
  const sent: { record: SignupRecord; email: BuiltEmail }[] = []

  const deps = {
    providedSecret: SECRET,
    expectedSecret: SECRET,
    claim: vi.fn(async (userId: string) => {
      if (claimed.has(userId)) return false
      claimed.add(userId)
      return true
    }),
    release: vi.fn(async (userId: string) => {
      claimed.delete(userId)
    }),
    sendEmail: vi.fn(async (record: SignupRecord, email: BuiltEmail) => {
      if (remainingFailures > 0) {
        remainingFailures--
        throw new Error('Simulated provider outage')
      }
      sent.push({ record, email })
    }),
    log: vi.fn(),
  }

  return { deps, sent, claimed }
}

describe('processSignupWebhook — one account, one notification', () => {
  it('sends exactly one owner email for a genuinely new account', async () => {
    const h = makeHarness()
    const result = await processSignupWebhook({ ...h.deps, payload: insertPayload() })

    expect(result.outcome).toBe('sent')
    expect(result.httpStatus).toBe(200)
    expect(h.deps.sendEmail).toHaveBeenCalledTimes(1)
    expect(h.sent).toHaveLength(1)
    expect(h.sent[0].email.subject).toBe(SIGNUP_EMAIL_SUBJECT)
  })

  it('suppresses duplicate webhook deliveries for the same user id', async () => {
    const h = makeHarness()
    const payload = insertPayload()

    const first = await processSignupWebhook({ ...h.deps, payload })
    const second = await processSignupWebhook({ ...h.deps, payload })
    const third = await processSignupWebhook({ ...h.deps, payload })

    expect(first.outcome).toBe('sent')
    expect(second.outcome).toBe('duplicate')
    expect(third.outcome).toBe('duplicate')
    // Despite three deliveries, only ONE email was ever sent.
    expect(h.deps.sendEmail).toHaveBeenCalledTimes(1)
    expect(h.sent).toHaveLength(1)
  })

  it('sends one email each for two different new accounts', async () => {
    const h = makeHarness()
    await processSignupWebhook({ ...h.deps, payload: insertPayload() })
    await processSignupWebhook({
      ...h.deps,
      payload: insertPayload({ id: '99999999-0000-0000-0000-000000000000', email: 'b@example.com' }),
    })
    expect(h.deps.sendEmail).toHaveBeenCalledTimes(2)
  })
})

describe('processSignupWebhook — security', () => {
  it('rejects a request with a missing secret and never processes it', async () => {
    const h = makeHarness()
    const result = await processSignupWebhook({
      ...h.deps,
      providedSecret: null,
      payload: insertPayload(),
    })
    expect(result.outcome).toBe('unauthorized')
    expect(result.httpStatus).toBe(401)
    expect(h.deps.claim).not.toHaveBeenCalled()
    expect(h.deps.sendEmail).not.toHaveBeenCalled()
  })

  it('rejects a request with an incorrect secret', async () => {
    const h = makeHarness()
    const result = await processSignupWebhook({
      ...h.deps,
      providedSecret: 'wrong-secret',
      payload: insertPayload(),
    })
    expect(result.outcome).toBe('unauthorized')
    expect(h.deps.sendEmail).not.toHaveBeenCalled()
  })

  it('never leaks passwords, tokens, or Stripe data into the email', async () => {
    const h = makeHarness()
    await processSignupWebhook({ ...h.deps, payload: insertPayload() })
    const { email } = h.sent[0]
    const haystack = `${email.subject}\n${email.html}\n${email.text}`.toLowerCase()

    for (const forbidden of ['hunter2', 'eyjfake.token', 'refresh-abc', 'cus_abc123', 'sub_xyz789']) {
      expect(haystack).not.toContain(forbidden.toLowerCase())
    }
    // But it DOES contain the four required, safe fields.
    expect(email.text).toContain('Alex Coach')
    expect(email.text).toContain('coach@example.com')
    expect(email.text).toContain('11111111-2222-3333-4444-555555555555')
    expect(email.text).toContain('2026')
  })
})

describe('processSignupWebhook — resilience', () => {
  it('does not mark as sent when the email fails, and a retry then sends exactly one', async () => {
    const h = makeHarness({ failSendTimes: 1 })
    const payload = insertPayload()

    const first = await processSignupWebhook({ ...h.deps, payload })
    expect(first.outcome).toBe('send_failed')
    expect(first.httpStatus).toBe(500)
    // Claim was released so the id is free to retry.
    expect(h.claimed.has('11111111-2222-3333-4444-555555555555')).toBe(false)

    const retry = await processSignupWebhook({ ...h.deps, payload })
    expect(retry.outcome).toBe('sent')
    expect(h.sent).toHaveLength(1) // exactly one email overall
  })

  it('ignores non-INSERT events and unparseable records without sending', async () => {
    const h = makeHarness()
    const update = await processSignupWebhook({
      ...h.deps,
      payload: { type: 'UPDATE', table: 'profiles', record: { id: 'x', email: 'y@z.com' } },
    })
    const empty = await processSignupWebhook({ ...h.deps, payload: { type: 'INSERT', record: null } })

    expect(update.outcome).toBe('ignored')
    expect(empty.outcome).toBe('ignored')
    expect(h.deps.sendEmail).not.toHaveBeenCalled()
  })
})

describe('pure helpers', () => {
  it('extractSignupRecord returns null without id or email', () => {
    expect(extractSignupRecord({ type: 'INSERT', record: { id: 'a' } })).toBeNull()
    expect(extractSignupRecord({ type: 'INSERT', record: { email: 'a@b.com' } })).toBeNull()
    expect(extractSignupRecord(null)).toBeNull()
  })

  it('verifyWebhookSecret fails closed on empty config', () => {
    expect(verifyWebhookSecret('anything', '')).toBe(false)
    expect(verifyWebhookSecret('', 'anything')).toBe(false)
    expect(verifyWebhookSecret('same', 'same')).toBe(true)
  })

  it('buildSignupEmail uses the exact required subject', () => {
    const email = buildSignupEmail({
      id: 'abc',
      email: 'a@b.com',
      fullName: '',
      createdAt: '2026-08-28T14:03:00.000Z',
    })
    expect(email.subject).toBe('New EQHO Player signup')
    // Missing name renders as a safe placeholder, not an empty/blank field.
    expect(email.text).toContain('Not provided')
  })
})
