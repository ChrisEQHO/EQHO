import { NextRequest, NextResponse } from 'next/server'
import {
  readManifest,
  getDemoAudioStream,
  type DemoManifest,
} from '@/lib/demo/demo-storage'

/**
 * PUBLIC, read-only demo API. No authentication. Serves ONLY the published demo
 * snapshot under the demo/ prefix.
 *
 * Privacy: the JSON payload contains only public display names, ordering,
 * durations and opaque demo track ids. It exposes NO storage keys, user ids,
 * emails, tokens, Supabase ids, signed URLs or credentials. Audio is streamed by
 * opaque track id, and the server resolves the id → demo/ key internally, so no
 * private path ever crosses the network. There is NO fallback to private files.
 */

export const dynamic = 'force-dynamic'

// The client never needs storage keys, so strip audioKey from what we return.
type PublicTrack = { id: string; name: string; durationSeconds: number }
type PublicPlaylist = { id: string; name: string; tracks: PublicTrack[] }
interface PublicPayload {
  enabled: boolean
  playlists: PublicPlaylist[]
}

function toPublic(manifest: DemoManifest): PublicPayload {
  if (!manifest.enabled) return { enabled: false, playlists: [] }
  return {
    enabled: true,
    playlists: manifest.playlists.map((p) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        durationSeconds: t.durationSeconds,
      })),
    })),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // ---- Audio streaming by opaque track id --------------------------------
  if (action === 'audio') {
    const trackId = searchParams.get('track') || ''
    const manifest = await readManifest()
    if (!manifest.enabled) {
      return NextResponse.json({ error: 'Demo unavailable' }, { status: 404 })
    }
    // Resolve id → demo audio key server-side; never trust a client-supplied key.
    let audioKey: string | null = null
    for (const p of manifest.playlists) {
      for (const t of p.tracks) {
        if (t.id === trackId) audioKey = t.audioKey
      }
    }
    if (!audioKey) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }
    // Forward the browser's Range header so the media element can seek/scrub.
    // A missing/invalid header simply yields a normal 200 full-object stream.
    const rangeHeader = request.headers.get('range')
    const stream = await getDemoAudioStream(audioKey, rangeHeader)
    if (!stream) {
      // No fallback to private files — a missing demo object is simply missing.
      return NextResponse.json({ error: 'Track unavailable' }, { status: 404 })
    }

    // Partial content: R2 honoured the Range, so reply 206 with Content-Range.
    if (stream.range) {
      const { start, end, total } = stream.range
      return new NextResponse(stream.body, {
        status: 206,
        headers: {
          'Content-Type': stream.contentType,
          'Content-Length': String(end - start + 1),
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Full object. Advertise range support so the player enables seeking.
    return new NextResponse(stream.body, {
      status: 200,
      headers: {
        'Content-Type': stream.contentType,
        ...(stream.contentLength
          ? { 'Content-Length': String(stream.contentLength) }
          : {}),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // ---- Manifest (default) ------------------------------------------------
  const manifest = await readManifest()
  return NextResponse.json(toPublic(manifest), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
