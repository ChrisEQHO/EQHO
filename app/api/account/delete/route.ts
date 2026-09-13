import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { deleteAllUserObjects } from '@/lib/r2-admin'
import { runAccountDeletion } from '@/lib/account-deletion'
import { captureServer, ANALYTICS_EVENTS } from '@/lib/analytics/posthog-server'

// Lazily build a Stripe client from the secret key. We deliberately do NOT import
// the shared `@/lib/stripe` singleton: it instantiates `new Stripe(KEY!)` at module
// load, which THROWS when the key is absent and would crash this entire route
// before auth even runs. Cancelling the subscription is a best-effort step here,
// so a missing/invalid key must never block account deletion — return null and skip.
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  try {
    return new Stripe(key, { apiVersion: '2025-05-28.basil', typescript: true })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Permanent account deletion.
//
// This exists as an API ROUTE (not the old server action) because the mobile
// Capacitor build is a STATIC EXPORT: server actions don't exist there, and the
// app authenticates with a Supabase Bearer token, not cookies. Mirroring the
// /api/r2 and /api/playlists/delete pattern — CORS + cookie-OR-Bearer auth —
// lets the exact same call work from the web app and from the iPad app (which
// hits the deployed https route via getApiBase() + getAuthHeaders()).
//
// Security: the target user is ALWAYS the server-verified session/token user.
// No id is ever accepted from the client, so a caller can only delete itself.
// The security-critical ordering + best-effort/failure semantics live in the
// pure `runAccountDeletion` core (unit-tested in lib/account-deletion.test.ts);
// this route only supplies the real Supabase/Stripe/R2/analytics side effects.
//
// Privacy: this route never logs the user id, email, tokens, or file names.
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// Auth: cookie session (web) OR Bearer access token (mobile static export).
// Identical resolution to /api/r2 and /api/playlists/delete.
async function resolveUser(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {
    /* fall through to bearer */
  }
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (token) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) return user
    } catch {
      /* invalid token */
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[v0] /api/account/delete called')

  const supabase = await createSSRClient()
  if (!supabase) return json({ success: false, error: 'Auth not configured' }, 500)

  const hasServiceKey = Boolean(supabaseUrl && supabaseServiceKey)

  // Admin client (service role) for privileged reads/deletes that bypass RLS.
  // Only built when the key is present; the core refuses deletion otherwise.
  const adminClient =
    hasServiceKey && supabaseUrl && supabaseServiceKey
      ? createServiceClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null

  const stripe = getStripe()

  const result = await runAccountDeletion({
    hasServiceKey,

    // Server-verified caller — never a client-supplied id.
    resolveUserId: async () => {
      const user = await resolveUser(request, supabase)
      return user?.id ?? null
    },

    getStripeRefs: async (userId) => {
      if (!adminClient) return { subscriptionId: null, customerId: null }
      const { data } = await adminClient
        .from('profiles')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', userId)
        .maybeSingle()
      return {
        subscriptionId: (data?.stripe_subscription_id as string | null) ?? null,
        customerId: (data?.stripe_customer_id as string | null) ?? null,
      }
    },

    cancelSubscription: async (subscriptionId) => {
      if (!stripe) throw new Error('Stripe not configured')
      await stripe.subscriptions.cancel(subscriptionId)
    },

    listCancellableSubscriptions: async (customerId) => {
      if (!stripe) return []
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
      return subs.data
        .filter((s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due')
        .map((s) => s.id)
    },

    deleteStorageObjects: async (userId) => {
      await deleteAllUserObjects(userId)
    },

    deleteUserRows: async (userId) => {
      if (!adminClient) return
      // allSettled: one failing table must not stop the others (and the Auth-user
      // deletion cascades FK-linked rows regardless).
      await Promise.allSettled([
        adminClient.from('cloud_tracks').delete().eq('user_id', userId),
        adminClient.from('cloud_playlists').delete().eq('user_id', userId),
        adminClient.from('profiles').delete().eq('id', userId),
      ])
    },

    deleteAuthUser: async (userId) => {
      if (!adminClient) throw new Error('Service role not configured')
      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) throw error
    },

    captureAccountDeleted: async (userId, hadSubscription) => {
      await captureServer(userId, ANALYTICS_EVENTS.account_deleted, {
        reason: 'user_initiated',
        had_subscription: hadSubscription,
      })
    },

    signOut: async () => {
      await supabase.auth.signOut()
    },
  })

  if (result.success) {
    console.log('[v0] /api/account/delete: completed')
  } else {
    console.warn('[v0] /api/account/delete: not completed —', result.error)
  }

  return json(
    result.success ? { success: true } : { success: false, error: result.error },
    result.status,
  )
}
