import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { requirePlayerEntitlement } from '@/lib/entitlement-server'

// ---------------------------------------------------------------------------
// CORS (mirrors /api/r2 so the Capacitor app can call this cross-origin too).
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
// Identical resolution to /api/r2 so both clients work.
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

function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucketName = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  return { accessKeyId, secretAccessKey, bucketName, endpoint }
}

function createR2Client(): { client: S3Client; bucket: string } | null {
  const { accessKeyId, secretAccessKey, bucketName, endpoint } = getR2Config()
  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) return null
  return {
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket: bucketName,
  }
}

// Delete EVERY object under the playlist's folder (tracks + any metadata),
// paginating through the bucket listing and batch-deleting up to 1000 at a time.
async function deletePlaylistObjects(
  r2: { client: S3Client; bucket: string },
  userId: string,
  playlistId: string,
): Promise<number> {
  const prefix = `users/${userId}/playlists/${playlistId}/`
  let deleted = 0
  let continuationToken: string | undefined = undefined

  do {
    const list: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: r2.bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    const listed = await r2.client.send(list)
    const keys = (listed.Contents || [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k)

    if (keys.length > 0) {
      await r2.client.send(
        new DeleteObjectsCommand({
          Bucket: r2.bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      )
      deleted += keys.length
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)

  return deleted
}

// POST { playlistId } — permanently delete a playlist the caller owns from both
// Cloudflare R2 and Supabase. The DB deletes use the SERVICE ROLE key so they
// succeed regardless of whether an RLS DELETE policy exists (missing DELETE
// policies were causing the client-side delete to silently affect 0 rows while
// still reporting success). Ownership is verified first so a user can only ever
// delete their own playlist.
export async function POST(request: NextRequest) {
  const supabase = await createSSRClient()
  if (!supabase) return json({ error: 'Auth not configured' }, 500)

  const user = await resolveUser(request, supabase)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  // Paywall gate (production only). Free phase passes everyone through.
  const entitlement = await requirePlayerEntitlement(request, user)
  if (!entitlement.allowed) {
    return json({ error: 'Subscription required', reason: entitlement.result.reason }, 402)
  }

  let rawId = ''
  let name = ''
  try {
    const body = await request.json()
    rawId = typeof body?.playlistId === 'string' ? body.playlistId.trim() : ''
    name = typeof body?.name === 'string' ? body.name.trim() : ''
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (!rawId && !name) return json({ error: 'Missing playlistId or name' }, 400)

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return json({ error: 'Server storage not configured' }, 500)
  }
  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const idIsUuid = UUID_RE.test(rawId)

  // Resolve which cloud playlist(s) to delete, ALWAYS scoped to this user. The
  // client may send:
  //   • a Supabase UUID (Manage Cloud Playlists list) — match by id, or
  //   • a LOCAL IndexedDB id that is NOT the cloud UUID (Playlists library card)
  //     plus the playlist name — in which case we match by name instead.
  // Matching by name is safe because it's scoped to user_id, and it's the reason
  // deleting from the library used to silently fail (local id != cloud id, so the
  // old `.eq('id', localId)` matched nothing and the cloud copy survived).
  const { data: userPlaylists, error: listErr } = await admin
    .from('playlists')
    .select('id, name')
    .eq('user_id', user.id)

  if (listErr) {
    console.error('[v0] playlist delete: playlist lookup failed', listErr.message)
    return json({ error: `Lookup failed: ${listErr.message}` }, 500)
  }

  const targets = (userPlaylists || []).filter(
    (p) => (idIsUuid && p.id === rawId) || (!!name && p.name === name),
  )

  if (targets.length === 0) {
    // Nothing in the cloud matches — already deleted or never uploaded. Idempotent
    // success so the client can safely drop it from its UI.
    console.log('[v0] playlist delete: no matching cloud playlist, treating as already deleted', { rawId, name })
    return json({ success: true, deletedObjects: 0, deletedPlaylists: 0 })
  }

  const r2 = createR2Client()
  let deletedObjects = 0
  let deletedPlaylists = 0

  for (const target of targets) {
    // 1) Delete all audio from R2 (best-effort; don't abort DB cleanup on error).
    if (r2) {
      try {
        deletedObjects += await deletePlaylistObjects(r2, user.id, target.id)
      } catch (e) {
        console.error('[v0] playlist delete: R2 cleanup error', (e as Error)?.message)
      }
    }

    // 2) Delete DB rows with the service role, scoped by user_id for safety.
    const { error: tracksErr } = await admin
      .from('tracks')
      .delete()
      .eq('playlist_id', target.id)
      .eq('user_id', user.id)
    if (tracksErr) {
      console.error('[v0] playlist delete: tracks delete failed', tracksErr.message)
      return json({ error: `Failed to delete tracks: ${tracksErr.message}` }, 500)
    }

    const { error: playlistErr } = await admin
      .from('playlists')
      .delete()
      .eq('id', target.id)
      .eq('user_id', user.id)
    if (playlistErr) {
      console.error('[v0] playlist delete: playlist delete failed', playlistErr.message)
      return json({ error: `Failed to delete playlist: ${playlistErr.message}` }, 500)
    }
    deletedPlaylists += 1
  }

  console.log('[v0] playlist delete: success', { deletedPlaylists, deletedObjects })
  return json({ success: true, deletedObjects, deletedPlaylists })
}
