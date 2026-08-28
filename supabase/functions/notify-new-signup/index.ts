// =============================================================================
// notify-new-signup — Supabase Edge Function (Deno runtime)
// -----------------------------------------------------------------------------
// Triggered by a Supabase DATABASE WEBHOOK on INSERT into public.profiles (i.e.
// once per genuinely new account — see supabase/functions/notify-new-signup/
// README.md for the exact webhook + secret configuration). It emails the owner
// that a new EQHO Player account was created.
//
// All decision logic lives in ./core.ts (pure, unit-tested in Node/Vitest). This
// file only supplies the real side effects: reading secrets from the Deno env,
// the Resend client, and a `signup_notifications` table used as the exactly-once
// idempotency store (Supabase user id = primary key).
//
// This function runs AFTER the profile row is committed, so nothing here can
// affect the customer's ability to create or use their account. It never logs
// or emails passwords, tokens, Stripe/payment data, secret keys, or any music/
// playlist content.
// =============================================================================

// @ts-nocheck — this file targets the Deno runtime; types resolve at deploy time.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import {
  processSignupWebhook,
  safeError,
  type SignupRecord,
  type BuiltEmail,
  type SignupWebhookPayload,
} from './core.ts'

// Header the Database Webhook must send (configured in the Supabase dashboard).
const SECRET_HEADER = 'x-signup-webhook-secret'

// Resend requires a verified sending domain; fall back to the shared onboarding
// sender (matches the existing /api/contact behaviour) until the domain is set.
const FROM_ADDRESS =
  Deno.env.get('SIGNUP_NOTIFICATION_FROM') || 'EQHO Player <onboarding@resend.dev>'

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  const expectedSecret = Deno.env.get('SIGNUP_WEBHOOK_SECRET')
  const providedSecret = req.headers.get(SECRET_HEADER)
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const toAddress = Deno.env.get('SIGNUP_NOTIFICATION_EMAIL')

  // Parse the JSON body defensively; an unparseable body is simply ignored.
  let payload: SignupWebhookPayload | null = null
  try {
    payload = (await req.json()) as SignupWebhookPayload
  } catch {
    payload = null
  }

  // Service-role client bypasses RLS; used ONLY for the idempotency marker table.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase =
    supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

  const resend = resendApiKey ? new Resend(resendApiKey) : null

  const result = await processSignupWebhook({
    providedSecret,
    expectedSecret,
    payload,

    // Claim atomically by inserting the user id as the primary key. A duplicate
    // delivery hits the PK unique violation (23505) and returns false.
    claim: async (userId: string) => {
      if (!supabase) throw new Error('Supabase client unavailable')
      const { error } = await supabase
        .from('signup_notifications')
        .insert({ user_id: userId })
      if (!error) return true
      // 23505 = unique_violation → already claimed → not a new claim.
      if ((error as { code?: string }).code === '23505') return false
      throw new Error(`claim insert failed (${(error as { code?: string }).code ?? 'unknown'})`)
    },

    // Undo a claim so a later webhook retry can re-send after a provider failure.
    release: async (userId: string) => {
      if (!supabase) return
      await supabase.from('signup_notifications').delete().eq('user_id', userId)
    },

    sendEmail: async (_record: SignupRecord, email: BuiltEmail) => {
      if (!resend) throw new Error('RESEND_API_KEY not configured')
      if (!toAddress) throw new Error('SIGNUP_NOTIFICATION_EMAIL not configured')
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: toAddress,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
      if (error) throw new Error(`Resend error: ${safeError(error)}`)
    },

    // Structured, secret-free logging.
    log: (level, message, meta) => {
      const line = `[notify-new-signup] ${message}`
      if (level === 'error') console.error(line, meta ?? '')
      else if (level === 'warn') console.warn(line, meta ?? '')
      else console.log(line, meta ?? '')
    },
  })

  return json(result.httpStatus, { ok: result.httpStatus < 400, outcome: result.outcome })
})

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
