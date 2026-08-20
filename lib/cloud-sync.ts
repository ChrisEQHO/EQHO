import { createClient } from '@/lib/supabase/client'
import {
  uploadTrackToR2,
  downloadTrackFromR2,
  deleteTrackFromR2,
  getTrackStorageKey,
  isR2Configured,
  uploadPlaylistMetadataToR2,
  getPlaylistMetadataFromR2,
  listUserPlaylistsFromR2,
  listPlaylistTracksFromR2,
  getSignedDownloadUrl,
  probeTrackAccess,
  getApiBase,
  getAuthHeaders,
} from '@/lib/r2-storage'

// Types matching the Supabase schema
// Lightweight track shape attached to a cloud playlist for display + loading.
// Note: this carries metadata + the R2 storage_path only — the actual audio File
// is downloaded on demand via "Load from Cloud" (handleDownloadCloudPlaylist).
export interface CloudPlaylistTrack {
  id: string
  title: string
  fileName: string
  durationSeconds: number
  storage_path: string
}

export interface CloudPlaylist {
  id: string
  user_id: string
  name: string
  description?: string
  track_order: string[]
  gap_seconds: number
  created_at: string
  updated_at: string
  // Populated by fetchCloudPlaylists so the library can show track counts/previews
  // for playlists that live in the cloud but aren't downloaded on this device yet.
  tracks: CloudPlaylistTrack[]
}

export interface CloudTrack {
  id: string
  user_id: string
  playlist_id: string | null
  title: string
  duration: number
  storage_path: string
  file_size?: number
  mime_type: string
  created_at: string
  updated_at: string
}

// Local types for the player
export interface LocalTrack {
  id: string
  title: string
  fileName: string
  durationSeconds: number
  uploadedAt: string
  file: File
}

export interface LocalPlaylist {
  id: string
  name: string
  tracks: LocalTrack[]
}

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

// Supabase `playlists.id` and `tracks.id` are UUID columns. Local playlist/track
// IDs (especially legacy ones from IndexedDB) may not be valid UUIDs, so we must
// never force them into UUID columns or use them in `.eq('id', ...)` lookups —
// doing so throws "invalid input syntax for type uuid" and the upload silently fails.
const isValidUuid = (value?: string): boolean =>
  !!value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

// Derive a stable identity key for matching local tracks against cloud tracks,
// since cloud track IDs are server-generated UUIDs and won't match local IDs.
// storage_path looks like: users/{userId}/playlists/{playlistId}/tracks/{trackId}/{fileName}
const cloudTrackKey = (title: string, fileNameOrStoragePath: string): string => {
  const fileName = (fileNameOrStoragePath || '').split('/').pop() || ''
  return `${(title || '').trim().toLowerCase()}::${fileName.trim().toLowerCase()}`
}

// Pro subscription check for cloud sync gating
export async function checkProStatus(): Promise<boolean> {
  // STRIPE TEMPORARILY DISABLED - Always return true to allow access
  return true
}

// =====================
// PLAYLIST OPERATIONS
// =====================

export async function fetchCloudPlaylists(): Promise<CloudPlaylist[]> {
  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching playlists:', error)
    return []
  }

  const playlists = (data || []) as Omit<CloudPlaylist, 'tracks'>[]
  if (playlists.length === 0) return []

  // Fetch this user's tracks (RLS-scoped) and attach them to each playlist so the
  // library can render counts/previews for cloud playlists that aren't on this
  // device yet. We only need lightweight metadata + the R2 storage_path here.
  const { data: trackRows, error: tracksError } = await supabase
    .from('tracks')
    .select('id, title, storage_path, duration, playlist_id, created_at')

  if (tracksError) {
    console.error('Error fetching tracks for cloud playlists:', tracksError)
  }

  const tracksByPlaylist = new Map<string, CloudPlaylistTrack[]>()
  for (const t of trackRows || []) {
    if (!t.playlist_id) continue
    const fileName = (t.storage_path || '').split('/').pop() || t.title || 'audio'
    const uiTrack: CloudPlaylistTrack = {
      id: t.id,
      title: t.title,
      fileName,
      durationSeconds: t.duration || 0,
      storage_path: t.storage_path || '',
    }
    const arr = tracksByPlaylist.get(t.playlist_id) || []
    arr.push(uiTrack)
    tracksByPlaylist.set(t.playlist_id, arr)
  }

  return playlists.map((p) => {
    const unordered = tracksByPlaylist.get(p.id) || []
    // Respect the saved track_order, then append any leftovers.
    const order = Array.isArray(p.track_order) ? p.track_order : []
    const byId = new Map(unordered.map((t) => [t.id, t]))
    const ordered: CloudPlaylistTrack[] = []
    for (const id of order) {
      const t = byId.get(id)
      if (t) {
        ordered.push(t)
        byId.delete(id)
      }
    }
    for (const t of byId.values()) ordered.push(t)
    return { ...p, tracks: ordered }
  })
}

export async function fetchCloudPlaylistWithTracks(playlistId: string): Promise<{
  playlist: CloudPlaylist | null
  tracks: CloudTrack[]
}> {
  const supabase = createClient()
  if (!supabase) return { playlist: null, tracks: [] }

  const [playlistResult, tracksResult] = await Promise.all([
    supabase.from('playlists').select('*').eq('id', playlistId).single(),
    supabase.from('tracks').select('*').eq('playlist_id', playlistId)
  ])

  return {
    playlist: playlistResult.data,
    tracks: tracksResult.data || []
  }
}

// Stable identity key for a LOCAL track (title + fileName), matching the same
// scheme used to match local tracks against cloud tracks during upload. Exposed
// so the UI can compare a local playlist against its cloud version.
export function localTrackKey(title: string, fileName: string): string {
  return cloudTrackKey(title, fileName)
}

// Build a per-playlist "signature": the ORDERED list of track identity keys
// (title::fileName) for each of the current user's cloud playlists. The UI uses
// this to decide whether a local playlist is new, modified (added/removed/renamed/
// reordered/changed tracks), or fully synced. Read-only; does not mutate anything.
export async function fetchCloudPlaylistSignatures(): Promise<Record<string, string[]>> {
  const supabase = createClient()
  if (!supabase) return {}

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const [playlistsResult, tracksResult] = await Promise.all([
    supabase.from('playlists').select('id, track_order').eq('user_id', user.id),
    supabase.from('tracks').select('id, title, storage_path, playlist_id').eq('user_id', user.id),
  ])

  const playlists = playlistsResult.data || []
  const tracks = tracksResult.data || []

  // Map each cloud track id -> identity key, and group track ids by playlist.
  const idToKey = new Map<string, string>()
  const tracksByPlaylist = new Map<string, string[]>()
  for (const t of tracks) {
    idToKey.set(t.id, cloudTrackKey(t.title, t.storage_path || ''))
    if (t.playlist_id) {
      const arr = tracksByPlaylist.get(t.playlist_id) || []
      arr.push(t.id)
      tracksByPlaylist.set(t.playlist_id, arr)
    }
  }

  const signatures: Record<string, string[]> = {}
  for (const p of playlists) {
    const order: string[] = Array.isArray(p.track_order) ? p.track_order : []
    const seen = new Set<string>()
    const keys: string[] = []
    // Follow the saved track order first.
    for (const id of order) {
      const key = idToKey.get(id)
      if (key) {
        keys.push(key)
        seen.add(id)
      }
    }
    // Append any tracks belonging to the playlist that weren't in track_order
    // (e.g. legacy rows), so the signature reflects the full cloud contents.
    for (const id of tracksByPlaylist.get(p.id) || []) {
      if (!seen.has(id)) {
        const key = idToKey.get(id)
        if (key) keys.push(key)
      }
    }
    signatures[p.id] = keys
  }

  return signatures
}

export async function createCloudPlaylist(
  name: string,
  description?: string,
  gapSeconds: number = 3
): Promise<CloudPlaylist | null> {
  if (isMobileBuild) return null // Read-only on mobile

  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: user.id,
      name,
      description,
      gap_seconds: gapSeconds,
      track_order: []
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating playlist:', error)
    return null
  }

  return data
}

export async function updateCloudPlaylist(
  playlistId: string,
  updates: Partial<Pick<CloudPlaylist, 'name' | 'description' | 'track_order' | 'gap_seconds'>>
): Promise<boolean> {
  if (isMobileBuild) return false // Read-only on mobile

  // Update via the authoritative server route. The previous implementation ran
  // the Supabase update on the CLIENT with the anon key; without an RLS UPDATE
  // policy that update matched 0 rows and returned no error, so a reordered
  // track_order "saved" in the UI but never persisted — the playlist reverted to
  // its old order on the next upload/fetch. The /api/playlists/update route
  // verifies ownership and writes with the service role, so it always takes effect.
  try {
    const response = await fetch(`${getApiBase()}/api/playlists/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ playlistId, updates }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('[v0] updateCloudPlaylist failed', response.status, detail)
      return false
    }

    const result = await response.json().catch(() => ({}))
    return result?.success === true
  } catch (error) {
    console.error('[v0] updateCloudPlaylist error', error)
    return false
  }
}

export interface DeleteCloudPlaylistResult {
  success: boolean
  error?: string
  deletedPlaylists?: number
  deletedObjects?: number
}

// Delete a playlist from the cloud via the authoritative server route. Pass the
// playlist NAME as well as the id: cards in the Playlists library carry a LOCAL
// IndexedDB id that is NOT the Supabase UUID, so the server matches by name
// (scoped to the user) when the id isn't a cloud UUID. Without the name, deleting
// from the library silently missed the cloud copy and it came back on next sync.
// Returns a structured result so the UI can show the real server error.
export async function deleteCloudPlaylist(
  playlistId: string,
  name?: string,
): Promise<DeleteCloudPlaylistResult> {
  if (isMobileBuild) return { success: false, error: 'Deleting is not available in the app' }

  try {
    const response = await fetch(`${getApiBase()}/api/playlists/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ playlistId, name }),
    })

    const result = await response.json().catch(() => ({} as Record<string, unknown>))

    if (!response.ok || result?.success !== true) {
      const detail = (result?.error as string) || `Server error ${response.status}`
      console.error('[v0] deleteCloudPlaylist failed', response.status, detail)
      return { success: false, error: detail }
    }

    return {
      success: true,
      deletedPlaylists: result?.deletedPlaylists as number | undefined,
      deletedObjects: result?.deletedObjects as number | undefined,
    }
  } catch (error) {
    const detail = (error as Error)?.message || String(error)
    console.error('[v0] deleteCloudPlaylist error', detail)
    return { success: false, error: detail }
  }
}

// =====================
// TRACK OPERATIONS
// =====================

export async function uploadTrackToCloud(
  playlistId: string,
  track: LocalTrack
): Promise<CloudTrack | null> {
  if (isMobileBuild) return null // Read-only on mobile

  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Audio source check
  if (!track.file) {
    console.warn('[v0] uploadTrackToCloud: audio source MISSING for track', track.title)
    return null
  }
  console.log('[v0] uploadTrackToCloud: audio source FOUND for track', track.title, `(${track.file.size} bytes)`)

  // Upload file to R2 storage
  const r2Key = getTrackStorageKey(user.id, playlistId, track.id, track.fileName)
  
  const r2Result = await uploadTrackToR2(
    user.id,
    playlistId,
    track.id,
    track.file,
    { title: track.title, duration: track.durationSeconds }
  )

  if (!r2Result.success) {
    console.error('[v0] uploadTrackToCloud: R2 upload FAILED for track', track.title, '-', r2Result.error)
    return null
  }
  console.log('[v0] uploadTrackToCloud: R2 upload SUCCESS for track', track.title, '->', r2Key)

  // Store metadata in Supabase (not the file itself).
  // Only pass the local id when it's a valid UUID; otherwise let Postgres
  // generate one (uuid_generate_v4()) so a missing/legacy id never fails the insert.
  const trackInsert: Record<string, unknown> = {
    user_id: user.id,
    playlist_id: playlistId,
    title: track.title,
    duration: track.durationSeconds,
    storage_path: r2Key, // R2 object key
    file_size: track.file.size,
    mime_type: track.file.type || 'audio/mpeg',
  }
  if (isValidUuid(track.id)) {
    trackInsert.id = track.id
  }

  // Use maybeSingle() (never single()) so a SELECT that returns 0 rows does NOT
  // throw PGRST116. We must capture the server-generated Supabase id here, since
  // playlist.track_order is built from these returned ids (not local IndexedDB ids).
  const { data: inserted, error } = await supabase
    .from('tracks')
    .insert(trackInsert)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[v0] uploadTrackToCloud: Supabase track insert FAILED for', track.title, '-', error.message)
    // Clean up R2 file
    await deleteTrackFromR2(r2Key)
    return null
  }

  // Fallback: if the insert succeeded but the returning SELECT came back empty
  // (e.g. RLS/replication timing), look the row up by its unique storage_path
  // (the R2 key includes the track id, so it uniquely identifies this track).
  let row = inserted
  if (!row) {
    const { data: found } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .eq('storage_path', r2Key)
      .maybeSingle()
    row = found
  }

  if (!row) {
    console.error('[v0] uploadTrackToCloud: insert succeeded but could not resolve track id for', track.title)
    await deleteTrackFromR2(r2Key)
    return null
  }

  console.log('[v0] uploadTrackToCloud: Supabase track insert SUCCESS for', track.title, '-> id', row.id)
  return row
}

// Permanently delete a single track from the cloud from ANY platform (web +
// mobile). Supabase metadata deletion is authoritative and runs via supabase-js,
// so it works on the iOS static export (which cannot reach the cookie-authed
// /api/r2 route). R2 object deletion is BEST-EFFORT: on mobile the DELETE route
// is unreachable, so an R2 failure must never block removal. The caller uses
// `supabaseOk` to decide whether local removal may proceed.
export async function deleteTrackFromCloudDirect(
  trackId: string | null,
  storagePath: string | null,
): Promise<{ supabaseOk: boolean; r2Ok: boolean }> {
  const supabase = createClient()
  if (!supabase) {
    console.error('[v0] deleteTrackFromCloudDirect: no Supabase client')
    return { supabaseOk: false, r2Ok: false }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[v0] deleteTrackFromCloudDirect: no authenticated user')
    return { supabaseOk: false, r2Ok: false }
  }

  // Best-effort R2 delete first (never blocks the authoritative metadata delete).
  let r2Ok = false
  if (storagePath) {
    try {
      r2Ok = await deleteTrackFromR2(storagePath)
    } catch (err) {
      console.warn('[v0] deleteTrackFromCloudDirect: R2 delete failed (best-effort)', err)
      r2Ok = false
    }
  }

  // Authoritative Supabase metadata delete, scoped to this user for RLS safety.
  // Match by id when it is a real UUID, otherwise fall back to the unique
  // storage_path (the R2 key embeds the track id, so it identifies one row).
  let del = supabase.from('tracks').delete().eq('user_id', user.id)
  if (trackId && isValidUuid(trackId)) {
    del = del.eq('id', trackId)
  } else if (storagePath) {
    del = del.eq('storage_path', storagePath)
  } else {
    console.error('[v0] deleteTrackFromCloudDirect: no id or storage_path to delete by')
    return { supabaseOk: false, r2Ok }
  }

  const { error } = await del
  if (error) {
    console.error('[v0] deleteTrackFromCloudDirect: Supabase delete failed', error.message)
    return { supabaseOk: false, r2Ok }
  }

  console.log('[v0] deleteTrackFromCloudDirect: deleted', { trackId, storagePath, r2Ok })
  return { supabaseOk: true, r2Ok }
}

export async function deleteTrackFromCloud(trackId: string): Promise<boolean> {
  if (isMobileBuild) return false // Read-only on mobile

  const supabase = createClient()
  if (!supabase) return false

  // Get track to find storage path (R2 key)
  const { data: track } = await supabase
    .from('tracks')
    .select('storage_path')
    .eq('id', trackId)
    .single()

  if (track) {
    // Delete from R2 storage
    await deleteTrackFromR2(track.storage_path)
  }

  // Delete from database
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)

  if (error) {
    console.error('Error deleting track:', error)
    return false
  }

  return true
}

export async function downloadTrackFile(storagePath: string): Promise<File | null> {
  // Download from R2 using signed URL
  const file = await downloadTrackFromR2(storagePath)
  return file
}

/**
 * Get a signed URL for streaming a track (valid for 1 hour)
 */
export async function getTrackStreamUrl(storagePath: string): Promise<string | null> {
  return getSignedDownloadUrl(storagePath, 3600)
}

// =====================
// FULL SYNC OPERATIONS
// =====================

export async function syncPlaylistToCloud(localPlaylist: LocalPlaylist): Promise<{
  success: boolean
  cloudPlaylist?: CloudPlaylist
  uploadedTracks: number
  failedTracks?: number
}> {
  if (isMobileBuild) return { success: false, uploadedTracks: 0 }

  const supabase = createClient()
  if (!supabase) return { success: false, uploadedTracks: 0 }

  // Delegate to the robust uploader, which inserts missing playlists/tracks from
  // local data as the source of truth and never does failing per-id lookups
  // (the old `.eq('id', track.id).single()` lookup returned 406 when the row
  // didn't exist, blocking the upload entirely).
  const result = await uploadPlaylistToCloud({
    id: localPlaylist.id,
    name: localPlaylist.name,
    tracks: localPlaylist.tracks,
  })

  if (!result.success) {
    console.error('[v0] syncPlaylistToCloud: upload failed', result.error)
    return { success: false, uploadedTracks: 0 }
  }

  // Resolve the resulting cloud playlist row to return to the caller.
  const { data: cloudPlaylist } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
    .eq('name', localPlaylist.name)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    success: true,
    cloudPlaylist: cloudPlaylist || undefined,
    uploadedTracks: result.uploadedTracks,
    failedTracks: result.failedTracks,
  }
}

// Restore a single cloud playlist by downloading its real audio files from R2
// (via the secure /api/r2 signed download route). Returns the local playlist plus
// per-track failure info so the UI can report which tracks failed and never create
// empty playlist folders when audio downloads fail.
export type CloudRestoreReason =
  | 'access-denied'
  | 'not-configured'
  | 'missing'
  | 'offline'
  | 'unknown'

export async function fetchPlaylistWithFilesDetailed(
  playlistId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{
  playlist: LocalPlaylist | null
  failedTracks: string[]
  totalTracks: number
  reason?: CloudRestoreReason
}> {
  const supabase = createClient()
  if (!supabase) return { playlist: null, failedTracks: [], totalTracks: 0 }

  const { playlist, tracks } = await fetchCloudPlaylistWithTracks(playlistId)
  if (!playlist) {
    console.log('[v0][cloud-restore] Playlist not found for id', playlistId)
    return { playlist: null, failedTracks: [], totalTracks: 0 }
  }

  console.log(`[v0][cloud-restore] Playlist "${playlist.name}" — ${tracks.length} track(s) found`)

  // Download the real audio file for every track from R2.
  const localTracks: LocalTrack[] = []
  const failedTracks: string[] = []

  // Report initial progress (0 of total) so the UI can show 0% immediately.
  onProgress?.(0, tracks.length)

  // The audio object in R2 is keyed by the uploaded File's real name, but the DB
  // `storage_path` can record a slightly different fileName (sanitization / drift).
  // When a direct path download fails, we recover the track by matching it against
  // the playlist's ACTUAL R2 object listing (by trackId, then by fileName). The
  // listing is fetched lazily and only once per restore.
  let r2Listing: Array<{ key: string; fileName: string }> | null = null
  const getR2Listing = async (): Promise<Array<{ key: string; fileName: string }>> => {
    if (r2Listing === null) {
      try {
        // The route derives the user from the session, so userId here is unused
        // server-side; pass the playlist owner (or '') to satisfy the signature.
        r2Listing = await listPlaylistTracksFromR2((playlist as { user_id?: string }).user_id || '', playlist.id)
        console.log(`[v0][cloud-restore] R2 listing for playlist ${playlist.id}: ${r2Listing.length} object(s)`)
      } catch (err) {
        console.error('[v0][cloud-restore] R2 listing failed:', err)
        r2Listing = []
      }
    }
    return r2Listing
  }

  let completed = 0
  for (const track of tracks) {
    console.log(`[v0][cloud-restore]   track "${track.title}" storage_path: ${track.storage_path || '(none)'}`)
    let file = track.storage_path ? await downloadTrackFile(track.storage_path) : null

    // Fallback: the recorded storage_path didn't resolve. Find the track's real
    // object in R2 (same user's bucket prefix) by its trackId path segment, then
    // by fileName, and download that actual key instead.
    if (!file) {
      const listing = await getR2Listing()
      if (listing.length > 0) {
        const dbFileName = (track.storage_path || '').split('/').pop() || ''
        const match =
          listing.find(o => o.key.includes(`/tracks/${track.id}/`)) ||
          (dbFileName ? listing.find(o => o.fileName === dbFileName) : undefined)
        if (match) {
          console.log(`[v0][cloud-restore]   ↺ retry "${track.title}" via listed key: ${match.key}`)
          file = await downloadTrackFile(match.key)
        }
      }
    }

    if (file) {
      console.log(`[v0][cloud-restore]   ✓ downloaded "${track.title}"`)
      localTracks.push({
        id: track.id,
        title: track.title,
        fileName: file.name,
        durationSeconds: track.duration,
        uploadedAt: track.created_at,
        file
      })
    } else {
      console.error(`[v0][cloud-restore] Could not download ${track.title} from cloud (storage_path: ${track.storage_path || 'none'})`)
      failedTracks.push(track.title)
    }
    completed++
    onProgress?.(completed, tracks.length)
  }

  // Never create an empty playlist/folder if no audio could be downloaded.
  if (localTracks.length === 0) {
    console.log(`[v0][cloud-restore] Skipping "${playlist.name}" — no audio downloaded`)
    // Classify WHY every track failed so the UI can show an actionable message,
    // by probing access to the first track's storage path.
    let reason: CloudRestoreReason = 'unknown'
    const firstWithPath = tracks.find(t => t.storage_path)
    if (firstWithPath?.storage_path) {
      const probe = await probeTrackAccess(firstWithPath.storage_path)
      console.log(`[v0][cloud-restore] access probe status: ${probe.status} (${probe.error || 'ok'})`)
      if (probe.status === 403) reason = 'access-denied'
      else if (probe.status === 500) reason = 'not-configured'
      else if (probe.status === 404) reason = 'missing'
      else if (probe.status === 0) reason = 'offline'
    }
    return { playlist: null, failedTracks, totalTracks: tracks.length, reason }
  }

  // Sort by track_order, then append any tracks not present in the saved order.
  const orderedTracks = playlist.track_order
    .map(id => localTracks.find(t => t.id === id))
    .filter((t): t is LocalTrack => t !== undefined)

  const unorderedTracks = localTracks.filter(
    t => !playlist.track_order.includes(t.id)
  )

  return {
    playlist: {
      id: playlist.id,
      name: playlist.name,
      tracks: [...orderedTracks, ...unorderedTracks]
    },
    failedTracks,
    totalTracks: tracks.length,
  }
}

export async function fetchPlaylistWithFiles(playlistId: string): Promise<LocalPlaylist | null> {
  const { playlist } = await fetchPlaylistWithFilesDetailed(playlistId)
  return playlist
}

// =====================
// AUTH HELPERS
// =====================

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export function isCloudSyncAvailable(): boolean {
  const supabase = createClient()
  return supabase !== null
}

// =====================
// COACH SETTINGS OPERATIONS
// =====================

export interface CoachSettings {
  id?: string
  user_id?: string
  default_gap_seconds: number
  default_volume: number
  countdown_enabled: boolean
  countdown_seconds: number
  autoplay_next: boolean
  back_to_back_default: boolean
  show_pause_warning: boolean
  show_skip_warning: boolean
  playlist_repeats: number
  created_at?: string
  updated_at?: string
}

export async function fetchCoachSettings(): Promise<CoachSettings | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('coach_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Settings don't exist yet, that's ok
    return null
  }

  return data
}

export async function saveCoachSettings(settings: Partial<CoachSettings>): Promise<boolean> {
  if (isMobileBuild) return false

  const supabase = createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if settings already exist
  const { data: existing } = await supabase
    .from('coach_settings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing settings
    const { error } = await supabase
      .from('coach_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating coach settings:', error)
      return false
    }
  } else {
    // Create new settings
    const { error } = await supabase
      .from('coach_settings')
      .insert({
        user_id: user.id,
        ...settings
      })

    if (error) {
      console.error('Error creating coach settings:', error)
      return false
    }
  }

  return true
}

// =====================
// SYNC STATUS & PUSH TO APPS
// =====================

export interface SyncInfo {
  last_synced_at: string | null
  last_pushed_at: string | null
}

export async function getSyncInfo(): Promise<SyncInfo | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('last_synced_at, last_pushed_at')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

export async function pushToApps(): Promise<boolean> {
  if (isMobileBuild) return false

  const supabase = createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Update the last_pushed_at timestamp
  const { error } = await supabase
    .from('profiles')
    .update({ 
      last_pushed_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating push timestamp:', error)
    return false
  }

  return true
}

// =====================
// EXPORT/DOWNLOAD FUNCTIONALITY
// =====================

export interface ExportData {
  exportedAt: string
  playlists: Array<{
    id: string
    name: string
    description?: string
    trackOrder: string[]
    gapSeconds: number
    tracks: Array<{
      id: string
      title: string
      duration: number
    }>
  }>
  coachSettings: CoachSettings | null
}

export async function exportAllData(): Promise<ExportData | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all playlists
  const { data: playlists, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)

  if (playlistError) {
    console.error('Error fetching playlists for export:', playlistError)
    return null
  }

  // Fetch all tracks
  const { data: allTracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', user.id)

  if (tracksError) {
    console.error('Error fetching tracks for export:', tracksError)
  }

  // Fetch coach settings
  const coachSettings = await fetchCoachSettings()

  // Build export data
  const exportPlaylists = (playlists || []).map(playlist => {
    const playlistTracks = (allTracks || [])
      .filter(t => t.playlist_id === playlist.id)
      .map(t => ({
        id: t.id,
        title: t.title,
        duration: t.duration
      }))

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackOrder: playlist.track_order || [],
      gapSeconds: playlist.gap_seconds || 3,
      tracks: playlistTracks
    }
  })

  return {
    exportedAt: new Date().toISOString(),
    playlists: exportPlaylists,
    coachSettings
  }
}

// =====================
// UPLOAD TO CLOUD (Full Sync)
// =====================

/**
 * Upload a single playlist with all tracks to the cloud (R2 + Supabase metadata)
 */
export async function uploadPlaylistToCloud(
  localPlaylist: {
    id: string
    name: string
    tracks: Array<{
      id: string
      title: string
      fileName: string
      durationSeconds: number
      uploadedAt?: string
      file?: File
    }>
  },
  coachSettings?: {
    gapSeconds: number
    countdownEnabled: boolean
    countdownSeconds: number
    autoplayNext: boolean
    backToBackDefault: boolean
    showPauseWarning: boolean
    showSkipWarning: boolean
    playlistRepeats: number
  }
): Promise<{
  success: boolean
  uploadedTracks: number
  skippedTracks: number
  failedTracks?: number
  error?: string
}> {
  if (isMobileBuild) return { success: false, uploadedTracks: 0, skippedTracks: 0, error: 'Read-only on mobile' }

  const supabase = createClient()
  if (!supabase) return { success: false, uploadedTracks: 0, skippedTracks: 0, error: 'Supabase not configured' }
  
  if (!isR2Configured()) {
    return { success: false, uploadedTracks: 0, skippedTracks: 0, error: 'R2 storage not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, uploadedTracks: 0, skippedTracks: 0, error: 'Not authenticated' }

  try {
    // Check if playlist exists, create if not.
    // Only look up by id when the local id is a valid UUID; otherwise fall back to
    // matching this user's playlist by name (avoids "invalid input syntax for type uuid").
    let existingPlaylist: CloudPlaylist | null = null

    if (isValidUuid(localPlaylist.id)) {
      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', localPlaylist.id)
        .maybeSingle()
      existingPlaylist = data
    }

    if (!existingPlaylist) {
      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', localPlaylist.name)
        .maybeSingle()
      existingPlaylist = data
    }

    if (!existingPlaylist) {
      // Insert from local data as the source of truth. Only pass the local id when
      // it's a valid UUID; otherwise let Postgres generate one.
      // Use a constant default for the playlist's gap_seconds column (it may be
      // NOT NULL); we intentionally do NOT sync the user's actual gap setting.
      const playlistInsert: Record<string, unknown> = {
        user_id: user.id,
        name: localPlaylist.name,
        track_order: [],
        gap_seconds: 3,
      }
      if (isValidUuid(localPlaylist.id)) {
        playlistInsert.id = localPlaylist.id
      }

      const { data: newPlaylist, error } = await supabase
        .from('playlists')
        .insert(playlistInsert)
        .select()
        .single()

      if (error) {
        return { success: false, uploadedTracks: 0, skippedTracks: 0, error: `Failed to create playlist: ${error.message}` }
      }
      existingPlaylist = newPlaylist
    }

    if (!existingPlaylist) {
      return { success: false, uploadedTracks: 0, skippedTracks: 0, error: 'Failed to resolve cloud playlist' }
    }

    // Upload tracks
    let uploadedCount = 0
    let skippedCount = 0
    let attemptedCount = 0
    let failedCount = 0
    const trackOrder: string[] = []

    console.log(
      `[v0] uploadPlaylistToCloud: playlist "${localPlaylist.name}" has ${localPlaylist.tracks.length} local track(s)`
    )

    // Fetch existing cloud tracks for this playlist ONCE, and match local tracks by
    // a stable identity (title + fileName) rather than by id. Cloud track IDs are
    // server-generated UUIDs, so looking up by the local id is meaningless and also
    // errors on non-UUID local ids. Local playlist data is the source of truth.
    const { data: existingCloudTracks } = await supabase
      .from('tracks')
      .select('id, title, storage_path')
      .eq('playlist_id', existingPlaylist.id)

    const existingTrackKeys = new Map<string, string>() // identity key -> cloud track id
    for (const ct of existingCloudTracks || []) {
      existingTrackKeys.set(cloudTrackKey(ct.title, ct.storage_path || ''), ct.id)
    }

    for (const track of localPlaylist.tracks) {
      // Skip if an equivalent track already exists in the cloud for this playlist.
      const existingId = existingTrackKeys.get(cloudTrackKey(track.title, track.fileName))
      if (existingId) {
        console.log(`[v0] uploadPlaylistToCloud: SKIP "${track.title}" — reason: already in cloud`)
        trackOrder.push(existingId)
        skippedCount++
        continue
      }

      // Skip tracks without files (can't upload audio). Note: we never require
      // file_url/storage_path on the local track — only the actual audio File.
      if (!track.file) {
        console.log(`[v0] uploadPlaylistToCloud: SKIP "${track.title}" — reason: no audio File resolved locally`)
        skippedCount++
        continue
      }

      console.log(`[v0] uploadPlaylistToCloud: UPLOADING "${track.title}" (${track.file.size} bytes) to R2`)

      // Insert/upload from local data as the source of truth.
      const localTrack: LocalTrack = {
        id: track.id,
        title: track.title,
        fileName: track.fileName,
        durationSeconds: track.durationSeconds,
        uploadedAt: track.uploadedAt || new Date().toISOString(),
        file: track.file,
      }

      attemptedCount++
      const uploaded = await uploadTrackToCloud(existingPlaylist.id, localTrack)
      if (uploaded) {
        uploadedCount++
        trackOrder.push(uploaded.id)
        // Record so duplicate local entries in the same batch aren't re-uploaded.
        existingTrackKeys.set(cloudTrackKey(track.title, track.fileName), uploaded.id)
      } else {
        failedCount++
      }
    }

    // If we tried to upload tracks (they had audio) but every one failed, this is a
    // real error (most commonly R2 not configured server-side). Surface it instead of
    // reporting a misleading "success with 0 tracks".
    if (attemptedCount > 0 && uploadedCount === 0) {
      console.error(
        `[v0] uploadPlaylistToCloud: all ${attemptedCount} track upload(s) failed for "${localPlaylist.name}". Check R2 configuration (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ACCOUNT_ID).`
      )
      return {
        success: false,
        uploadedTracks: 0,
        skippedTracks: skippedCount,
        error: 'Track audio upload failed. Cloudflare R2 storage is not configured on the server.',
      }
    }

    console.log(
      `[v0] uploadPlaylistToCloud: "${localPlaylist.name}" done — uploaded ${uploadedCount}, skipped ${skippedCount}, failed ${failedCount}`
    )

    // Update the playlist manifest only: name + track order (the R2 storage paths,
    // track names and durations are stored per-track in the `tracks` table).
    // NOTE: Cloud upload intentionally does NOT write coach_settings, profiles,
    // player settings, volume, gap/countdown/back-to-back, or subscription data.
    await updateCloudPlaylist(existingPlaylist.id, {
      track_order: trackOrder,
      name: localPlaylist.name,
    })

    // NOTE: success here means the playlist manifest was updated. Per-track upload
    // failures are surfaced via `failedTracks` so the UI can flag partial failures.
    return { success: true, uploadedTracks: uploadedCount, skippedTracks: skippedCount, failedTracks: failedCount }
  } catch (error) {
    console.error('Error uploading playlist to cloud:', error)
    return { 
      success: false, 
      uploadedTracks: 0, 
      skippedTracks: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Sync all local playlists to the cloud
 */
export async function syncAllPlaylistsToCloud(
  localPlaylists: Array<{
    id: string
    name: string
    tracks: Array<{
      id: string
      title: string
      fileName: string
      durationSeconds: number
      uploadedAt?: string
      file?: File
    }>
  }>,
  coachSettings?: {
    gapSeconds: number
    countdownEnabled: boolean
    countdownSeconds: number
    autoplayNext: boolean
    backToBackDefault: boolean
    showPauseWarning: boolean
    showSkipWarning: boolean
    playlistRepeats: number
  }
): Promise<{
  success: boolean
  syncedPlaylists: number
  totalUploaded: number
  errors: string[]
}> {
  const errors: string[] = []
  let syncedPlaylists = 0
  let totalUploaded = 0

  const totalLocalTracks = localPlaylists.reduce((sum, p) => sum + p.tracks.length, 0)
  console.log(
    `[v0] syncAllPlaylistsToCloud: found ${localPlaylists.length} local playlist(s) with ${totalLocalTracks} total local track(s)`
  )

  for (const playlist of localPlaylists) {
    const result = await uploadPlaylistToCloud(playlist, coachSettings)
    if (result.success) {
      syncedPlaylists++
      totalUploaded += result.uploadedTracks
    } else if (result.error) {
      errors.push(`${playlist.name}: ${result.error}`)
    }
  }

  // Cloud upload only handles playlists + audio. It intentionally does NOT update
  // any profile/sync timestamps or player/coach settings.

  return {
    success: errors.length === 0,
    syncedPlaylists,
    totalUploaded,
    errors,
  }
}

/**
 * Download all playlists from cloud for the current user
 */
export async function downloadAllPlaylistsFromCloud(): Promise<{
  playlists: LocalPlaylist[]
  failedTracks: string[]
  error?: string
}> {
  const supabase = createClient()
  if (!supabase) return { playlists: [], failedTracks: [], error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { playlists: [], failedTracks: [], error: 'Not authenticated' }

  try {
    // Read the user's cloud playlists from Supabase.
    const cloudPlaylists = await fetchCloudPlaylists()
    console.log(`[v0][cloud-restore] Found ${cloudPlaylists.length} cloud playlist(s):`, cloudPlaylists.map(p => p.name))

    const localPlaylists: LocalPlaylist[] = []
    const failedTracks: string[] = []

    // Restore each playlist as its own separate local playlist, downloading the
    // real audio from R2. Playlists with no downloadable audio are skipped (no
    // empty folders). NOTE: we intentionally do NOT restore coach_settings,
    // profiles, subscriptions, gap/volume/countdown or back-to-back settings.
    for (const cloudPlaylist of cloudPlaylists) {
      const { playlist, failedTracks: failed } = await fetchPlaylistWithFilesDetailed(cloudPlaylist.id)
      for (const f of failed) failedTracks.push(`${cloudPlaylist.name} – ${f}`)
      if (playlist) {
        localPlaylists.push(playlist)
      }
    }

    console.log(`[v0][cloud-restore] Restored ${localPlaylists.length} playlist(s); ${failedTracks.length} track(s) failed`)

    return { playlists: localPlaylists, failedTracks }
  } catch (error) {
    console.error('[v0][cloud-restore] Error downloading playlists from cloud:', error)
    return {
      playlists: [],
      failedTracks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if cloud storage is available (R2 + Supabase configured)
 */
export function isCloudStorageAvailable(): boolean {
  return isCloudSyncAvailable() && isR2Configured()
}
