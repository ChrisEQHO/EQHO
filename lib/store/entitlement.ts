// Server-only: decide whether a user may download the CLEAN MASTER of a track.
//
// A user is entitled when ANY of these is true:
//   1. They are an admin (email in the ADMIN_EMAILS allowlist).
//   2. The track is included_in_subscription AND they have an active/trialing
//      subscription (reuses the same rule as player access, lib/access.ts).
//   3. They hold a COMPLETED purchase row for the track.
//
// Everyone (including anonymous visitors) can always stream the watermarked
// PREVIEW; that is handled in the audio route, not here.

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail, hasActiveEntitlement } from '@/lib/access'
import type { SubscriptionStatus } from '@/lib/subscription-types'
import type { StoreTrack, TrackEntitlement } from './types'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** True if the user has a completed purchase for this track. */
export async function hasCompletedPurchase(userId: string, trackId: string): Promise<boolean> {
  const supabase = getAdminClient()
  if (!supabase) return false
  const { data, error } = await supabase
    .from('store_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .eq('status', 'completed')
    .maybeSingle()
  if (error) {
    console.error('[v0][store] hasCompletedPurchase error:', error.message)
    return false
  }
  return !!data
}

/** Set of track ids the user has completed purchases for (for list views). */
export async function getPurchasedTrackIds(userId: string): Promise<Set<string>> {
  const supabase = getAdminClient()
  if (!supabase) return new Set()
  const { data, error } = await supabase
    .from('store_purchases')
    .select('track_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
  if (error) {
    console.error('[v0][store] getPurchasedTrackIds error:', error.message)
    return new Set()
  }
  return new Set((data ?? []).map((r) => r.track_id as string))
}

/**
 * Resolve entitlement for a single track given the caller's context. Pure and
 * synchronous — callers fetch subscription status / purchase state first.
 */
export function resolveEntitlement(params: {
  track: Pick<StoreTrack, 'included_in_subscription'>
  email: string | null | undefined
  subscriptionStatus: SubscriptionStatus | null | undefined
  hasPurchase: boolean
}): TrackEntitlement {
  const { track, email, subscriptionStatus, hasPurchase } = params
  if (isAdminEmail(email)) return { entitled: true, reason: 'admin' }
  if (track.included_in_subscription && hasActiveEntitlement(subscriptionStatus, email)) {
    return { entitled: true, reason: 'subscription' }
  }
  if (hasPurchase) return { entitled: true, reason: 'purchase' }
  return { entitled: false, reason: 'none' }
}
