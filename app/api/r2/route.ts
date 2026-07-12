import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// The Capacitor iOS/Android app is a static export served from its own origin
// (capacitor://localhost). It calls THIS route on the deployed domain over
// full HTTPS, so the responses must be CORS-enabled. Auth is via a Bearer token
// (not cookies), so a wildcard origin is safe here — no credentials are shared.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// Auth: cookie session (web) OR Bearer access token (mobile static export).
// ---------------------------------------------------------------------------
async function resolveUser(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<User | null> {
  // 1) Cookie-based session (web app).
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {
    /* fall through to bearer */
  }

  // 2) Bearer token (Capacitor app — cross-origin, no cookies). The token is a
  // Supabase JWT from the SAME project, so getUser(jwt) validates it.
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

// R2 Configuration
// Read env vars at request time (not module load) so credentials added to the
// deployment after the serverless module first initialized are still picked up.
// Uses exactly the Vercel-provided names: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ENDPOINT.
function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucketName = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)

  return { accessKeyId, secretAccessKey, accountId, bucketName, endpoint }
}

function isR2Configured(): boolean {
  const { accessKeyId, secretAccessKey, bucketName, endpoint } = getR2Config()
  return !!(accessKeyId && secretAccessKey && bucketName && endpoint)
}

function getBucketName(): string | undefined {
  return getR2Config().bucketName
}

function createR2Client(): S3Client | null {
  const { accessKeyId, secretAccessKey, endpoint } = getR2Config()

  if (!isR2Configured() || !endpoint) {
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  })
}

// GET: Generate signed download URL or list objects
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return json({ error: 'Auth not configured' }, 500)
  }
  const user = await resolveUser(request, supabase)

  if (!user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const client = createR2Client()
  if (!client) {
    return json({ error: 'R2 not configured' }, 500)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const key = searchParams.get('key')

  try {
    if (action === 'download-url' && key) {
      // Verify the key belongs to this user
      if (!key.startsWith(`users/${user.id}/`)) {
        return json({ error: 'Access denied' }, 403)
      }

      const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })

      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
      return json({ url: signedUrl })
    }

    // Proxy-download the actual audio bytes through this route. This avoids the
    // browser fetching the R2 presigned URL directly, which fails when the R2
    // bucket has no CORS rule for the app origin (the common cause of cloud
    // restore returning 0 playable tracks). The server streams the file back.
    if (action === 'download' && key) {
      if (!key.startsWith(`users/${user.id}/`)) {
        return json({ error: 'Access denied' }, 403)
      }

      const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })

      const obj = await client.send(command)
      if (!obj.Body) {
        return json({ error: 'Object not found' }, 404)
      }

      // Body is a web ReadableStream in the Node 18+/edge-compatible runtime.
      const body = obj.Body as unknown as ReadableStream
      return new NextResponse(body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': obj.ContentType || 'audio/mpeg',
          ...(obj.ContentLength ? { 'Content-Length': String(obj.ContentLength) } : {}),
          'Cache-Control': 'private, max-age=0, no-store',
        },
      })
    }

    if (action === 'list-playlists') {
      const prefix = `users/${user.id}/playlists/`
      const command = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
        Delimiter: '/',
      })

      const response = await client.send(command)
      const playlistIds: string[] = []
      
      if (response.CommonPrefixes) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            const parts = prefix.Prefix.split('/')
            const playlistId = parts[parts.length - 2]
            if (playlistId) {
              playlistIds.push(playlistId)
            }
          }
        }
      }

      return json({ playlistIds })
    }

    if (action === 'list-tracks') {
      const playlistId = searchParams.get('playlistId')
      if (!playlistId) {
        return json({ error: 'Missing playlistId' }, 400)
      }

      const prefix = `users/${user.id}/playlists/${playlistId}/tracks/`
      const command = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
      })

      const response = await client.send(command)
      const tracks: Array<{ key: string; fileName: string; size: number }> = []
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            const fileName = object.Key.split('/').pop() || 'track.mp3'
            tracks.push({ 
              key: object.Key, 
              fileName,
              size: object.Size || 0
            })
          }
        }
      }

      return json({ tracks })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (error) {
    console.error('R2 GET error:', error)
    return json({ error: 'R2 operation failed' }, 500)
  }
}

// POST: Upload file or get upload URL
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return json({ error: 'Auth not configured' }, 500)
  }
  const user = await resolveUser(request, supabase)

  if (!user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const client = createR2Client()
  if (!client) {
    return json({ error: 'R2 not configured' }, 500)
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Direct file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const playlistId = formData.get('playlistId') as string | null
      const trackId = formData.get('trackId') as string | null
      const title = formData.get('title') as string | null
      const duration = formData.get('duration') as string | null

      if (!file || !playlistId || !trackId) {
        return json({ error: 'Missing required fields' }, 400)
      }

      const key = `users/${user.id}/playlists/${playlistId}/tracks/${trackId}/${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: buffer,
        ContentType: file.type || 'audio/mpeg',
        Metadata: {
          'x-track-id': trackId,
          'x-playlist-id': playlistId,
          'x-user-id': user.id,
          'x-title': encodeURIComponent(title || file.name),
          'x-duration': duration || '0',
          'x-file-name': encodeURIComponent(file.name),
          'x-file-size': String(file.size),
          'x-uploaded-at': new Date().toISOString(),
        },
      })

      await client.send(command)
      return json({ success: true, key })
    } else {
      // JSON request for presigned upload URL
      const body = await request.json()
      const { playlistId, trackId, fileName, contentType: fileContentType } = body

      if (!playlistId || !trackId || !fileName) {
        return json({ error: 'Missing required fields' }, 400)
      }

      const key = `users/${user.id}/playlists/${playlistId}/tracks/${trackId}/${fileName}`
      const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        ContentType: fileContentType || 'audio/mpeg',
      })

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
      return json({ uploadUrl, key })
    }
  } catch (error) {
    console.error('R2 POST error:', error)
    return json({ error: 'Upload failed' }, 500)
  }
}

// DELETE: Delete file from R2
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return json({ error: 'Auth not configured' }, 500)
  }
  const user = await resolveUser(request, supabase)

  if (!user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const client = createR2Client()
  if (!client) {
    return json({ error: 'R2 not configured' }, 500)
  }

  try {
    const { key } = await request.json()

    if (!key) {
      return json({ error: 'Missing key' }, 400)
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`users/${user.id}/`)) {
      return json({ error: 'Access denied' }, 403)
    }

    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })

    await client.send(command)
    return json({ success: true })
  } catch (error) {
    console.error('R2 DELETE error:', error)
    return json({ error: 'Delete failed' }, 500)
  }
}
