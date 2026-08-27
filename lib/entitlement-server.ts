// Server-only helpers that bridge an incoming request to the pure entitlement
// authority in `lib/entitlement.ts`. Used by `/api/entitlement` (the canonical
// check for the mobile client gate) and by the protected write APIs.
//
// Profiles are read with the SERVICE ROLE so the check works identically for
// cookie sessions (web) and Bearer tokens (Capacitor app), regardless of RLS.

import 'server-only'
import type { NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  evaluateEntitlement,
  getServerNow,
  isProductionRuntime,
  type EntitlementResult,
} from '@/lib/entitlement'
import type { SubscriptionStatus } from '@/lib/subscription-types'

// Auth: cookie session (web) OR Bearer access token (mobile static export).
// Identical resolution to /api/r2 and /api/playlists/*.
export async function resolveUserFromRequest(
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

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface EntitlementProfileRow {
  subscription_status: SubscriptionStatus | null
  current_period_end: string | null
  trial_end: string | null
  email: string | null
}

// Load the minimal profile fields the entitlement rule needs. Returns null if
// the profile can't be read; callers treat that as "no entitlement".
export async function loadEntitlementProfile(
  userId: string,
): Promise<EntitlementProfileRow | null> {
  const admin = getAdminClient()
  if (!admin) return null
  const { data, error } = await admin
    .from('profiles')
    .select('subscription_status, current_period_end, trial_end, email')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[v0][entitlement] profile load error:', error.message)
    return null
  }
  return (data as EntitlementProfileRow) ?? null
}

// The honest decision for a resolved user, using trusted server time. Callers
// that ENFORCE (write APIs) additionally gate on production; this function does
// not — it always reports the true evaluation so `/api/entitlement` and manual
// QA (`?now=` in non-prod) reflect reality.
export async function evaluateForUser(
  request: NextRequest,
  user: User,
): Promise<{ result: EntitlementResult; profile: EntitlementProfileRow | null }> {
  const profile = await loadEntitlementProfile(user.id)
  const now = getServerNow(request)
  const result = evaluateEntitlement({
    now,
    profile: profile
      ? { subscription_status: profile.subscription_status, current_period_end: profile.current_period_end }
      : null,
    email: user.email ?? profile?.email ?? null,
  })
  return { result, profile }
}

// Guard for protected WRITE APIs. Enforces only in production so the v0 preview
// and local dev stay fully usable while iterating.
export async function requirePlayerEntitlement(
  request: NextRequest,
  user: User,
): Promise<{ allowed: boolean; result: EntitlementResult }> {
  const { result } = await evaluateForUser(request, user)
  if (!isProductionRuntime()) return { allowed: true, result }
  return { allowed: result.allowed, result }
}
