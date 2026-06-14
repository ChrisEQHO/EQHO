import { createClient } from '@/lib/supabase/client'
import {
  uploadTrackToR2,
  downloadTrackFromR2,
  deleteTrackFromR2,
  deletePlaylistFromR2,
  getTrackStorageKey,
  isR2Configured,
  uploadPlaylistMetadataToR2,
  getPlaylistMetadataFromR2,
  listUserPlaylistsFromR2,
  listPlaylistTracksFromR2,
  getSignedDownloadUrl,
} from '@/lib/r2-storage'

// Types matching the Supabase schema
export interface CloudPlaylist {
  id: string
  user_id: string
  name: string
  description?: string
  track_order: string[]
  gap_seconds: number
  created_at: string
  updated_at: string
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

  return data || []
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

  const supabase = createClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)

  if (error) {
    console.error('Error updating playlist:', error)
    return false
  }

  return true
}

export async function deleteCloudPlaylist(playlistId: string): Promise<boolean> {
  if (isMobileBuild) return false // Read-only on mobile

  const supabase = createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Delete all files from R2 for this playlist
  await deletePlaylistFromR2(user.id, playlistId)

  // Delete tracks from database
  await supabase.from('tracks').delete().eq('playlist_id', playlistId)

  // Delete playlist
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)

  if (error) {
    console.error('Error deleting playlist:', error)
    return false
  }

  return true
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
  }
}

export async function fetchPlaylistWithFiles(playlistId: string): Promise<LocalPlaylist | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { playlist, tracks } = await fetchCloudPlaylistWithTracks(playlistId)
  if (!playlist) return null

  // Download all track files
  const localTracks: LocalTrack[] = []

  for (const track of tracks) {
    const file = await downloadTrackFile(track.storage_path)
    if (file) {
      localTracks.push({
        id: track.id,
        title: track.title,
        fileName: file.name,
        durationSeconds: track.duration,
        uploadedAt: track.created_at,
        file
      })
    }
  }

  // Sort by track_order
  const orderedTracks = playlist.track_order
    .map(id => localTracks.find(t => t.id === id))
    .filter((t): t is LocalTrack => t !== undefined)

  // Add any tracks not in the order
  const unorderedTracks = localTracks.filter(
    t => !playlist.track_order.includes(t.id)
  )

  return {
    id: playlist.id,
    name: playlist.name,
    tracks: [...orderedTracks, ...unorderedTracks]
  }
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

    return { success: true, uploadedTracks: uploadedCount, skippedTracks: skippedCount }
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
  coachSettings: CoachSettings | null
  error?: string
}> {
  const supabase = createClient()
  if (!supabase) return { playlists: [], coachSettings: null, error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { playlists: [], coachSettings: null, error: 'Not authenticated' }

  try {
    // Fetch all playlists
    const cloudPlaylists = await fetchCloudPlaylists()
    const localPlaylists: LocalPlaylist[] = []

    for (const cloudPlaylist of cloudPlaylists) {
      const localPlaylist = await fetchPlaylistWithFiles(cloudPlaylist.id)
      if (localPlaylist) {
        localPlaylists.push(localPlaylist)
      }
    }

    // Fetch coach settings
    const coachSettings = await fetchCoachSettings()

    return { playlists: localPlaylists, coachSettings }
  } catch (error) {
    console.error('Error downloading playlists from cloud:', error)
    return { 
      playlists: [], 
      coachSettings: null, 
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
