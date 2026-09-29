import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { requirePlayerEntitlement } from '@/lib/entitlement-server'
import { isUuid, sanitizeTrackOrder } from '@/lib/playlist-manifest'

// ---------------------------------------------------------------------------
// CORS (mirrors /api/r2 + /api/playlists/delete so the Capacitor app can call
// this cross-origin too).
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

// POST { playlistId, updates } — update a playlist the caller owns. Writes with
// the SERVICE ROLE key so the update always takes effect even if no RLS UPDATE
// policy exists (a missing UPDATE policy was causing the client-side
// updateCloudPlaylist to silently affect 0 rows — so a reordered track_order
// never persisted). Only a fixed allowlist of columns can be written, and
// ownership is verified first so a user can only ever modify their own playlist.
export async function POST(request: NextRequest) {
  const supabase = await createSSRClient()
  if (!supabase) return json({ error: 'Auth not configured' }, 500)

  const user = await resolveUser(request, supabase)
  if (!user) return json({ error: 'Unauthorized', stage: 'auth' }, 401)

  // Paywall gate (production only). Free phase passes everyone through.
  const entitlement = await requirePlayerEntitlement(request, user)
  if (!entitlement.allowed) {
    return json({ error: 'Subscription required', stage: 'entitlement', reason: entitlement.result.reason }, 402)
  }

  let playlistId = ''
  let rawUpdates: Record<string, unknown> = {}
  try {
    const body = await request.json()
    playlistId = typeof body?.playlistId === 'string' ? body.playlistId : ''
    rawUpdates = body?.updates && typeof body.updates === 'object' ? body.updates : {}
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (!playlistId) return json({ error: 'Missing playlistId' }, 400)

  // Build a sanitised update from an allowlist only. This prevents a client from
  // writing user_id or other protected columns.
  const updates: Record<string, unknown> = {}
  if (typeof rawUpdates.name === 'string') updates.name = rawUpdates.name
  if (typeof rawUpdates.description === 'string') updates.description = rawUpdates.description
  if (typeof rawUpdates.gap_seconds === 'number') updates.gap_seconds = rawUpdates.gap_seconds
  if (Array.isArray(rawUpdates.track_order)) {
    updates.track_order = sanitizeTrackOrder(rawUpdates.track_order)
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No valid fields to update', stage: 'request' }, 400)
  }
  if (!isUuid(playlistId)) {
    return json({ error: 'Invalid playlistId', stage: 'request' }, 400)
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return json({ error: 'Server storage not configured' }, 500)
  }
  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify ownership before updating anything.
  const { data: playlist, error: ownErr } = await admin
    .from('playlists')
    .select('id, user_id')
    .eq('id', playlistId)
    .maybeSingle()

  if (ownErr) {
    console.error('[v0] playlist update: ownership lookup failed', ownErr.code, ownErr.message)
    return json({ error: 'Lookup failed', stage: 'lookup', code: ownErr.code }, 500)
  }
  if (!playlist) return json({ error: 'Playlist not found', stage: 'lookup' }, 404)
  if (playlist.user_id !== user.id) return json({ error: 'Forbidden', stage: 'ownership' }, 403)

  // updated_at is deliberately NOT written here: the update_playlists_updated_at
  // trigger bumps it on every UPDATE, and writing it explicitly fails the whole
  // update (PGRST204) on any database where that column/trigger isn't present.

  const { error: updateErr } = await admin
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[v0] playlist update: update failed', updateErr.code, updateErr.message)
    return json({ error: 'Failed to update playlist', stage: 'update', code: updateErr.code }, 500)
  }

  console.log('[v0] playlist update: success', { playlistId, fields: Object.keys(updates) })
  return json({ success: true })
}
