// Client-side R2 storage operations via API routes
// All operations go through /api/r2 to keep credentials server-side

import { createClient } from '@/lib/supabase/client'

// The Capacitor mobile build is a STATIC EXPORT: it contains no /api routes and
// no middleware (see scripts/prepare-mobile-build.js). A relative fetch like
// `/api/r2` therefore resolves to the WebView's own origin and returns the SPA
// `index.html` (text/html) — the exact reason downloads reported "N tracks
// failed" and playback sometimes loaded HTML instead of an MP3.
//
// Fix: on mobile, send every R2 API call to the DEPLOYED production API over
// full HTTPS, and authenticate with the Supabase access token as a Bearer
// header (the cross-origin request carries no cookies). On web this base is ''
// (same-origin) and the cookie session is used as before.
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

export function getApiBase(): string {
  if (isMobileBuild) {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.eqho-player.com').replace(/\/$/, '')
  }
  return ''
}

// Build the Authorization header from the current Supabase session. Harmless on
// web (the API route still prefers the cookie session); required on mobile.
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    if (!supabase) return {}
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

// Check if R2 is configured (client-side check via env var prefix)
export function isR2Configured(): boolean {
  // On client side, we check if the API endpoint exists
  // The actual configuration is verified server-side
  return true // Assume configured, server will return error if not
}

// Types
export interface R2UploadResult {
  success: boolean
  key?: string
  error?: string
}

// =====================
// UPLOAD OPERATIONS (via API)
// =====================

/**
 * Upload a track file to R2 storage via API
 */
export async function uploadTrackToR2(
  userId: string,
  playlistId: string,
  trackId: string,
  file: File,
  metadata: { title: string; duration: number }
): Promise<R2UploadResult> {
  // PRIMARY: presigned PUT — upload the bytes DIRECTLY from the browser to R2.
  //
  // Why: the old path streamed the file as multipart/form-data through the
  // /api/r2 Route Handler. On Vercel a Serverless function request body is hard
  // capped at ~4.5 MB, so any normal audio track (a 2–3 min MP3 at 192–320 kbps
  // is ~4–7 MB, WAV far larger) was rejected with 413 before it could be stored.
  // When every track in a playlist exceeded that, the whole push failed —
  // exactly the "Push Unsuccessful" card. A presigned PUT goes straight to R2
  // and has no such size limit.
  //
  // The Content-Type sent on the PUT MUST equal the one used to sign the URL, or
  // R2 returns SignatureDoesNotMatch — so we send the identical value both times.
  const putContentType = file.type || 'audio/mpeg'
  try {
    const signRes = await fetch(`${getApiBase()}/api/r2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({
        playlistId,
        trackId,
        fileName: file.name,
        contentType: putContentType,
      }),
    })

    if (signRes.ok) {
      const { uploadUrl, key } = await signRes.json()
      if (uploadUrl && key) {
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': putContentType },
          body: file,
        })
        if (putRes.ok) {
          return { success: true, key }
        }
        console.warn(
          `[v0] R2 presigned PUT failed (status ${putRes.status}) for "${metadata.title}" — falling back to server upload. If large files keep failing, the R2 bucket needs a CORS policy allowing PUT from this origin.`
        )
      }
    } else {
      console.warn(`[v0] R2 presign request failed (status ${signRes.status}) — falling back to server upload`)
    }
  } catch (err) {
    console.warn('[v0] R2 presigned upload error, falling back to server upload:', err)
  }

  // FALLBACK: multipart upload through the API route. This works without any R2
  // bucket CORS config, but is still bounded by the serverless body limit, so it
  // only succeeds for small files. Kept so nothing regresses when the presigned
  // path is unavailable.
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('playlistId', playlistId)
    formData.append('trackId', trackId)
    formData.append('title', metadata.title)
    formData.append('duration', String(metadata.duration))

    const response = await fetch(`${getApiBase()}/api/r2`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      let message = 'Upload failed'
      try { message = (await response.json())?.error || message } catch {}
      return { success: false, error: message }
    }

    const result = await response.json()
    return { success: true, key: result.key }
  } catch (error) {
    console.error('Error uploading to R2:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Upload playlist metadata as JSON to R2 (via API)
 * Note: This is handled by the main cloud-sync through Supabase
 */
export async function uploadPlaylistMetadataToR2(
  userId: string,
  playlistId: string,
  metadata: {
    name: string
    description?: string
    trackOrder: string[]
    gapSeconds: number
    coachSettings?: Record<string, unknown>
  }
): Promise<R2UploadResult> {
  // Playlist metadata is stored in Supabase, not R2
  // This function is kept for compatibility
  return { success: true, key: `users/${userId}/playlists/${playlistId}/playlist.json` }
}

// =====================
// DOWNLOAD OPERATIONS (via API)
// =====================

/**
 * Get a signed download URL from the API
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const response = await fetch(
      `${getApiBase()}/api/r2?action=download-url&key=${encodeURIComponent(key)}`,
      { headers: await getAuthHeaders() },
    )
    
    if (!response.ok) {
      console.error('Failed to get signed URL')
      return null
    }

    const result = await response.json()
    return result.url
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return null
  }
}

/**
 * Download a track file from R2.
 *
 * Primary path: stream the bytes through our own /api/r2?action=download route
 * (server -> R2). This avoids the browser hitting the R2 presigned URL directly,
 * which fails when the bucket has no CORS rule for the app origin — the usual
 * reason cloud restore produced 0 playable tracks.
 *
 * Fallback: if the proxy route fails, try the presigned URL directly.
 */
// Validate that a fetched Response actually contains audio bytes (not the SPA
// index.html fallback that a broken/relative URL resolves to). Returns a File
// only when the content-type is not HTML/text AND the leading bytes are not an
// HTML document. Logs status, content-type, size, and first bytes per track.
async function responseToAudioFile(
  response: Response,
  key: string,
  fileName: string,
  requestedUrl: string,
  method: string,
): Promise<File | null> {
  const status = response.status
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  console.log(
    `[v0][cloud-restore] ${method} url=${requestedUrl} status=${status} content-type="${contentType}" key=${key}`
  )

  if (!response.ok) {
    console.warn(`[v0][cloud-restore] ${method} non-OK status ${status} for ${key}`)
    return null
  }

  // Reject HTML/text responses outright — this is not audio.
  if (contentType.includes('text/html') || contentType.startsWith('text/') || contentType.includes('application/xhtml')) {
    console.error(`[v0][cloud-restore] ${method} REJECT: content-type "${contentType}" is not audio for ${key}`)
    return null
  }

  const blob = await response.blob()
  const headBuf = await blob.slice(0, 16).arrayBuffer()
  const headBytes = new Uint8Array(headBuf)
  const firstHex = Array.from(headBytes).map((b) => b.toString(16).padStart(2, '0')).join(' ')
  const headAscii = String.fromCharCode(...headBytes).toLowerCase()
  console.log(`[v0][cloud-restore] ${method} blob size=${blob.size} first16=${firstHex} for ${fileName}`)

  if (blob.size === 0) {
    console.warn(`[v0][cloud-restore] ${method} empty blob for ${key}`)
    return null
  }

  // Reject an HTML document body regardless of the reported content-type.
  if (
    headAscii.startsWith('<!doctype') ||
    headAscii.startsWith('<html') ||
    headAscii.startsWith('<?xml') ||
    headAscii.startsWith('<head') ||
    headAscii.startsWith('<body')
  ) {
    console.error(`[v0][cloud-restore] ${method} REJECT: body starts with HTML markup for ${key} (${firstHex})`)
    return null
  }

  // Preserve the real content-type when it is audio/*, otherwise leave it to the
  // player's byte-level detection (do NOT stamp a fake audio type here).
  const type = contentType.startsWith('audio/') ? contentType : (blob.type || '')
  return new File([blob], fileName, { type })
}

export async function downloadTrackFromR2(key: string): Promise<File | null> {
  const fileName = key.split('/').pop() || 'track.mp3'

  // 1) Proxy download through our API (no browser->R2 CORS dependency).
  const proxyUrl = `${getApiBase()}/api/r2?action=download&key=${encodeURIComponent(key)}`
  try {
    const proxyResponse = await fetch(proxyUrl, { headers: await getAuthHeaders() })
    const file = await responseToAudioFile(proxyResponse, key, fileName, proxyUrl, 'R2-proxy')
    if (file) return file
    console.warn(`[v0][cloud-restore] R2 proxy did not yield audio for ${key}, trying signed URL`)
  } catch (error) {
    console.error('[v0][cloud-restore] R2 proxy download error, trying signed URL:', error)
  }

  // 2) Fallback: presigned URL fetched directly from R2.
  const signedUrl = await getSignedDownloadUrl(key)
  if (!signedUrl) {
    console.error(`[v0][cloud-restore] No signed URL available for ${key}`)
    return null
  }

  try {
    const response = await fetch(signedUrl)
    const file = await responseToAudioFile(response, key, fileName, signedUrl, 'R2-signed')
    return file
  } catch (error) {
    console.error('[v0][cloud-restore] Error downloading from R2 signed URL:', error)
    return null
  }
}

/**
 * Get playlist metadata from R2
 * Note: Playlist metadata is stored in Supabase
 */
export async function getPlaylistMetadataFromR2(
  userId: string,
  playlistId: string
): Promise<Record<string, unknown> | null> {
  // Playlist metadata is stored in Supabase, not R2
  return null
}

// =====================
// DELETE OPERATIONS (via API)
// =====================

/**
 * Delete a track from R2
 */
export async function deleteTrackFromR2(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBase()}/api/r2`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ key }),
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting from R2:', error)
    return false
  }
}

/**
 * Delete an entire playlist folder from R2 (including all tracks)
 * Note: This is handled server-side by deleting individual tracks
 */
export async function deletePlaylistFromR2(
  userId: string,
  playlistId: string
): Promise<boolean> {
  try {
    // First list all tracks in the playlist
    const tracks = await listPlaylistTracksFromR2(userId, playlistId)
    
    // Delete each track
    for (const track of tracks) {
      await deleteTrackFromR2(track.key)
    }

    return true
  } catch (error) {
    console.error('Error deleting playlist from R2:', error)
    return false
  }
}

// =====================
// LIST OPERATIONS (via API)
// =====================

/**
 * List all playlists for a user
 */
export async function listUserPlaylistsFromR2(
  userId: string
): Promise<string[]> {
  try {
    const response = await fetch(`${getApiBase()}/api/r2?action=list-playlists`, {
      headers: await getAuthHeaders(),
    })
    
    if (!response.ok) {
      return []
    }

    const result = await response.json()
    return result.playlistIds || []
  } catch (error) {
    console.error('Error listing playlists from R2:', error)
    return []
  }
}

/**
 * List all tracks in a playlist
 */
export async function listPlaylistTracksFromR2(
  userId: string,
  playlistId: string
): Promise<Array<{ key: string; fileName: string }>> {
  try {
    const response = await fetch(
      `${getApiBase()}/api/r2?action=list-tracks&playlistId=${encodeURIComponent(playlistId)}`,
      { headers: await getAuthHeaders() },
    )
    
    if (!response.ok) {
      return []
    }

    const result = await response.json()
    return result.tracks || []
  } catch (error) {
    console.error('Error listing tracks from R2:', error)
    return []
  }
}

/**
 * Probe whether the current user can access a given R2 object key.
 * Used to classify a failed cloud download: 403 = the object belongs to another
 * account, 500 = R2 not configured, 404 = object missing, 0 = network/offline.
 */
export async function probeTrackAccess(
  key: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const response = await fetch(
      `${getApiBase()}/api/r2?action=download-url&key=${encodeURIComponent(key)}`,
      { headers: await getAuthHeaders() },
    )
    if (response.ok) return { ok: true, status: response.status }
    let error: string | undefined
    try { error = (await response.json())?.error } catch {}
    return { ok: false, status: response.status, error }
  } catch {
    return { ok: false, status: 0, error: 'network' }
  }
}

// =====================
// UTILITY OPERATIONS
// =====================

/**
 * Get the R2 storage key for a track
 */
export function getTrackStorageKey(
  userId: string,
  playlistId: string,
  trackId: string,
  fileName: string
): string {
  return `users/${userId}/playlists/${playlistId}/tracks/${trackId}/${fileName}`
}
