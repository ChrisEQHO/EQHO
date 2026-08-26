import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { resolveEntitlement, hasCompletedPurchase } from '@/lib/store/entitlement'
import { isStoreKey } from '@/lib/store/r2-keys'
import type { StoreTrack } from '@/lib/store/types'
import type { SubscriptionStatus } from '@/lib/subscription-types'

// Streams music-store audio out of the private R2 bucket.
//
//   GET /api/store/audio?slug=<trackSlug>&type=preview   -> open to everyone
//   GET /api/store/audio?slug=<trackSlug>&type=master    -> entitled users only
//
// The clean master is gated by resolveEntitlement (admin OR active subscription
// OR completed purchase); unentitled callers get 403. Add &download=1 to receive
// the master as a file attachment. Mirrors /api/r2's cookie-or-Bearer auth and
// CORS handling so it works from both the web app and the Capacitor build.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// Cookie session (web) OR Bearer access token (Capacitor). Same pattern as /api/r2.
async function resolveUser(request: NextRequest, supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {
    /* fall through to bearer */
  }
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
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
    process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
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

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function streamKey(key: string, opts: { downloadName?: string } = {}) {
  const r2 = createR2Client()
  if (!r2) return json({ error: 'Storage not configured' }, 500)

  try {
    const obj = await r2.client.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }))
    if (!obj.Body) return json({ error: 'Audio not found' }, 404)
    const body = obj.Body as unknown as ReadableStream
    return new NextResponse(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': obj.ContentType || 'audio/mpeg',
        ...(obj.ContentLength ? { 'Content-Length': String(obj.ContentLength) } : {}),
        // Previews are cacheable; masters are private and must never be cached.
        'Cache-Control': opts.downloadName ? 'private, max-age=0, no-store' : 'private, max-age=300',
        ...(opts.downloadName
          ? { 'Content-Disposition': `attachment; filename="${opts.downloadName}"` }
          : {}),
      },
    })
  } catch (err) {
    console.error('[v0][store] streamKey error for', key, err)
    return json({ error: 'Audio not found' }, 404)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const type = (searchParams.get('type') || 'preview').toLowerCase()
  const wantsDownload = searchParams.get('download') === '1'

  if (!slug) return json({ error: 'Missing slug' }, 400)
  if (type !== 'preview' && type !== 'master') {
    return json({ error: 'Invalid type' }, 400)
  }

  const admin = getAdminClient()
  if (!admin) return json({ error: 'Server not configured' }, 500)

  // Look up the published track (service role; we filter is_published ourselves).
  const { data: trackRow, error: trackErr } = await admin
    .from('store_tracks')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (trackErr) {
    console.error('[v0][store] audio track lookup error:', trackErr.message)
    return json({ error: 'Lookup failed' }, 500)
  }
  if (!trackRow) return json({ error: 'Track not found' }, 404)
  const track = trackRow as StoreTrack

  // -------- Preview: open to everyone --------
  if (type === 'preview') {
    if (!track.preview_key || !isStoreKey(track.preview_key)) {
      return json({ error: 'Preview unavailable' }, 404)
    }
    return streamKey(track.preview_key)
  }

  // -------- Master: entitled users only --------
  if (!track.master_key || !isStoreKey(track.master_key)) {
    return json({ error: 'Master unavailable' }, 404)
  }

  const supabase = await createClient()
  if (!supabase) return json({ error: 'Auth not configured' }, 500)
  const user = await resolveUser(request, supabase)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  // Read subscription status from the profile, and purchase state, in parallel.
  const [{ data: profile }, purchased] = await Promise.all([
    admin
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle(),
    hasCompletedPurchase(user.id, track.id),
  ])

  const entitlement = resolveEntitlement({
    track,
    email: user.email,
    subscriptionStatus: (profile?.subscription_status as SubscriptionStatus) ?? null,
    hasPurchase: purchased,
  })

  if (!entitlement.entitled) {
    return json({ error: 'Not entitled to this track', reason: entitlement.reason }, 403)
  }

  const downloadName = wantsDownload ? `${track.slug}.mp3` : undefined
  return streamKey(track.master_key, { downloadName })
}
