// Client-side R2 storage operations via API routes
// All operations go through /api/r2 to keep credentials server-side

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
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('playlistId', playlistId)
    formData.append('trackId', trackId)
    formData.append('title', metadata.title)
    formData.append('duration', String(metadata.duration))

    const response = await fetch('/api/r2', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Upload failed' }
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
    const response = await fetch(`/api/r2?action=download-url&key=${encodeURIComponent(key)}`)
    
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
export async function downloadTrackFromR2(key: string): Promise<File | null> {
  const fileName = key.split('/').pop() || 'track.mp3'

  // 1) Proxy download through our API (no browser->R2 CORS dependency).
  try {
    const proxyResponse = await fetch(`/api/r2?action=download&key=${encodeURIComponent(key)}`)
    console.log(`[v0][cloud-restore] R2 proxy download status: ${proxyResponse.status} for ${key}`)
    if (proxyResponse.ok) {
      const blob = await proxyResponse.blob()
      console.log(`[v0][cloud-restore] R2 proxy blob size: ${blob.size} bytes for ${fileName}`)
      if (blob.size > 0) {
        return new File([blob], fileName, { type: blob.type || 'audio/mpeg' })
      }
      console.warn(`[v0][cloud-restore] R2 proxy returned empty blob for ${key}, trying signed URL`)
    } else {
      console.warn(`[v0][cloud-restore] R2 proxy download failed (${proxyResponse.status}), trying signed URL`)
    }
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
    console.log(`[v0][cloud-restore] R2 signed-url download status: ${response.status} for ${key}`)
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`)
    }

    const blob = await response.blob()
    console.log(`[v0][cloud-restore] R2 signed-url blob size: ${blob.size} bytes for ${fileName}`)
    return new File([blob], fileName, { type: blob.type || 'audio/mpeg' })
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
    const response = await fetch('/api/r2', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch('/api/r2?action=list-playlists')
    
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
    const response = await fetch(`/api/r2?action=list-tracks&playlistId=${encodeURIComponent(playlistId)}`)
    
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
    const response = await fetch(`/api/r2?action=download-url&key=${encodeURIComponent(key)}`)
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
