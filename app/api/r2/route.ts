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

// R2 Configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

function isR2Configured(): boolean {
  return !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && (R2_ENDPOINT || R2_ACCOUNT_ID))
}

function createR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })
}

// GET: Generate signed download URL or list objects
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createR2Client()
  if (!client) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const key = searchParams.get('key')

  try {
    if (action === 'download-url' && key) {
      // Verify the key belongs to this user
      if (!key.startsWith(`users/${user.id}/`)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })

      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
      return NextResponse.json({ url: signedUrl })
    }

    if (action === 'list-playlists') {
      const prefix = `users/${user.id}/playlists/`
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
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

      return NextResponse.json({ playlistIds })
    }

    if (action === 'list-tracks') {
      const playlistId = searchParams.get('playlistId')
      if (!playlistId) {
        return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 })
      }

      const prefix = `users/${user.id}/playlists/${playlistId}/tracks/`
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
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

      return NextResponse.json({ tracks })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('R2 GET error:', error)
    return NextResponse.json({ error: 'R2 operation failed' }, { status: 500 })
  }
}

// POST: Upload file or get upload URL
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createR2Client()
  if (!client) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 })
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
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const key = `users/${user.id}/playlists/${playlistId}/tracks/${trackId}/${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
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
      return NextResponse.json({ success: true, key })
    } else {
      // JSON request for presigned upload URL
      const body = await request.json()
      const { playlistId, trackId, fileName, contentType: fileContentType } = body

      if (!playlistId || !trackId || !fileName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const key = `users/${user.id}/playlists/${playlistId}/tracks/${trackId}/${fileName}`
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: fileContentType || 'audio/mpeg',
      })

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
      return NextResponse.json({ uploadUrl, key })
    }
  } catch (error) {
    console.error('R2 POST error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE: Delete file from R2
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createR2Client()
  if (!client) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 })
  }

  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`users/${user.id}/`)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await client.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('R2 DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
