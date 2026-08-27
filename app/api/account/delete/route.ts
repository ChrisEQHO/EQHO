import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { deleteAllUserObjects } from '@/lib/r2-admin'

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

  const user = await resolveUser(request, supabase)
  if (!user) return json({ success: false, error: 'Not authenticated' }, 401)

  // Deleting the Auth user requires the service role key. Without it we can only
  // wipe data but not the login itself, which would leave a "deleted" account
  // that can still sign in — so we refuse rather than half-delete.
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[v0] /api/account/delete: SUPABASE_SERVICE_ROLE_KEY is not configured')
    return json(
      { success: false, error: 'Account deletion is temporarily unavailable. Please contact support.' },
      500,
    )
  }

  const userId = user.id
  console.log('[v0] /api/account/delete: deleting user', userId)

  try {
    // Admin client (service role) for privileged reads/deletes that bypass RLS.
    const adminClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) Cancel Stripe subscription(s) immediately so deleting the account also
    //    unsubscribes the user. Read the Stripe refs from the profile BEFORE we
    //    delete the row. Immediate cancel (not cancel_at_period_end) since the
    //    whole account is going away. Best-effort: skipped if Stripe isn't configured.
    const stripe = getStripe()
    try {
      if (!stripe) throw new Error('Stripe not configured')
      const { data: profile } = await adminClient
        .from('profiles')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', userId)
        .maybeSingle()

      const subscriptionId = profile?.stripe_subscription_id as string | null | undefined
      const customerId = profile?.stripe_customer_id as string | null | undefined

      if (subscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscriptionId)
          console.log('[v0] /api/account/delete: cancelled subscription', subscriptionId)
        } catch (subErr) {
          console.warn('[v0] /api/account/delete: subscription cancel skipped:', subErr)
        }
      }

      // Safety net: sweep the customer for any OTHER live subscriptions so the
      // user cannot be left subscribed after deleting their account.
      if (customerId) {
        try {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
          for (const sub of subs.data) {
            if (sub.id === subscriptionId) continue
            if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
              try {
                await stripe.subscriptions.cancel(sub.id)
                console.log('[v0] /api/account/delete: cancelled extra subscription', sub.id)
              } catch (innerErr) {
                console.warn('[v0] /api/account/delete: extra subscription cancel skipped:', sub.id, innerErr)
              }
            }
          }
        } catch (listErr) {
          console.warn('[v0] /api/account/delete: could not list customer subscriptions:', listErr)
        }
      }
    } catch (stripeErr) {
      // Never block account deletion on a Stripe error — log and continue.
      console.warn('[v0] /api/account/delete: Stripe cancellation step failed:', stripeErr)
    }

    // 2) Delete every R2 object owned by the user (best-effort).
    const r2Result = await deleteAllUserObjects(userId)
    console.log('[v0] /api/account/delete: R2 cleanup', r2Result)

    // 3) Delete Supabase data rows (service role bypasses RLS so this is reliable).
    const { error: trackError } = await adminClient.from('cloud_tracks').delete().eq('user_id', userId)
    if (trackError) console.warn('[v0] /api/account/delete: cloud_tracks delete error:', trackError.message)

    const { error: playlistError } = await adminClient.from('cloud_playlists').delete().eq('user_id', userId)
    if (playlistError) console.warn('[v0] /api/account/delete: cloud_playlists delete error:', playlistError.message)

    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', userId)
    if (profileError) console.warn('[v0] /api/account/delete: profiles delete error:', profileError.message)

    // 4) Delete the Auth user. This is the step that truly removes the account.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[v0] /api/account/delete: auth user delete failed:', deleteError)
      return json(
        { success: false, error: 'We could not fully delete your account. Please contact support.' },
        500,
      )
    }

    // 5) Clear the local (web) session cookies. On mobile there is no cookie
    //    session; the client wipes its stored token after a success response.
    try {
      await supabase.auth.signOut()
    } catch {
      // Session is already invalid once the user is gone — safe to ignore.
    }

    console.log('[v0] /api/account/delete: completed for', userId)
    return json({ success: true })
  } catch (error) {
    console.error('[v0] /api/account/delete error:', error)
    return json({ success: false, error: 'An unexpected error occurred' }, 500)
  }
}
