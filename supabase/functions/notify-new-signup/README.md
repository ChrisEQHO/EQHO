# notify-new-signup

Emails the EQHO Player owner whenever a **genuinely new** account is created.
Triggered server-side only, via a Supabase Database Webhook on `public.profiles`
INSERT (one row is inserted per new user by the `handle_new_user` trigger).

## How it works

```
auth.users INSERT ─(handle_new_user trigger)─▶ public.profiles INSERT
                                                     │
                                     Database Webhook │ (POST + shared secret header)
                                                     ▼
                                       Edge Function: notify-new-signup
                                                     │
                    claim user_id in signup_notifications (PK = exactly once)
                                                     │
                                              Resend email ──▶ owner
```

- All logic is in `core.ts` (pure, unit-tested in `lib/notify-new-signup.test.ts`).
- `index.ts` supplies the Deno runtime side effects (env, Resend, DB).
- Runs **after** the profile row commits, so it can never block signup/login/
  email-confirmation or player use. A failure returns HTTP 500 and Supabase
  retries; the `signup_notifications` claim is rolled back on send failure so a
  retry re-sends, while a duplicate delivery is skipped — **exactly one email
  per user**.

## 1. Apply the database migration

Run `supabase/migrations/005_signup_notifications.sql` (creates the
`signup_notifications` idempotency table, RLS-locked to the service role).

## 2. Deploy the function

```bash
# JWT verification is disabled because auth is the shared secret header below.
supabase functions deploy notify-new-signup --no-verify-jwt
```

## 3. Set the function secrets

These are **Edge Function secrets** (set on Supabase, not Vercel):

```bash
supabase secrets set \
  RESEND_API_KEY="<your Resend API key>" \
  SIGNUP_NOTIFICATION_EMAIL="owner@your-domain.com" \
  SIGNUP_WEBHOOK_SECRET="<a long random string>"
# optional: verified Resend sender; defaults to onboarding@resend.dev
# SIGNUP_NOTIFICATION_FROM="EQHO Player <noreply@eqho-player.com>"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions
automatically — no need to set them.

## 4. Create the Database Webhook

Dashboard ▶ Database ▶ Webhooks ▶ **Create a new hook**:

- **Table:** `public.profiles`
- **Events:** `INSERT` only
- **Type:** Supabase Edge Function → `notify-new-signup` (method `POST`)
- **HTTP Headers:** add
  `x-signup-webhook-secret: <the same value as SIGNUP_WEBHOOK_SECRET>`

The function verifies this header (constant-time) before doing anything and
returns `401` without processing if it is missing or wrong. Because a client
cannot forge this secret, the notification cannot be triggered by untrusted
client-side requests.

## Email contents

Subject: **New EQHO Player signup**. Body includes only: customer name, customer
email, Supabase user id, and account creation date/time. It never contains
passwords, access/refresh tokens, Stripe/payment data, secret keys, or any
uploaded music/playlist information.

## Tests

`pnpm test` runs `lib/notify-new-signup.test.ts`, which proves one new account
produces exactly one owner notification, plus duplicate suppression, secret
rejection, redaction of sensitive fields, and retry-after-failure behaviour.
