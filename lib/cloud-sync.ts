import { createClient } from '@/lib/supabase/client'

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

  // First delete all tracks in the playlist (and their audio files)
  const { data: tracks } = await supabase
    .from('tracks')
    .select('storage_path')
    .eq('playlist_id', playlistId)

  if (tracks && tracks.length > 0) {
    // Delete audio files from storage
    const paths = tracks.map(t => t.storage_path)
    await supabase.storage.from('audio-tracks').remove(paths)
  }

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

  // Upload file to storage
  const storagePath = `${user.id}/${playlistId}/${track.id}-${track.fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('audio-tracks')
    .upload(storagePath, track.file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading track file:', uploadError)
    return null
  }

  // Create track record
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      id: track.id,
      user_id: user.id,
      playlist_id: playlistId,
      title: track.title,
      duration: track.durationSeconds,
      storage_path: storagePath,
      file_size: track.file.size,
      mime_type: track.file.type || 'audio/mpeg'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating track record:', error)
    // Clean up uploaded file
    await supabase.storage.from('audio-tracks').remove([storagePath])
    return null
  }

  return data
}

export async function deleteTrackFromCloud(trackId: string): Promise<boolean> {
  if (isMobileBuild) return false // Read-only on mobile

  const supabase = createClient()
  if (!supabase) return false

  // Get track to find storage path
  const { data: track } = await supabase
    .from('tracks')
    .select('storage_path')
    .eq('id', trackId)
    .single()

  if (track) {
    // Delete from storage
    await supabase.storage.from('audio-tracks').remove([track.storage_path])
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
  const supabase = createClient()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from('audio-tracks')
    .download(storagePath)

  if (error) {
    console.error('Error downloading track:', error)
    return null
  }

  // Extract filename from path
  const fileName = storagePath.split('/').pop() || 'track.mp3'
  
  return new File([data], fileName, { type: data.type || 'audio/mpeg' })
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

  // Check if playlist exists in cloud
  const { data: existingPlaylist } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', localPlaylist.id)
    .single()

  let cloudPlaylist: CloudPlaylist | null = existingPlaylist

  if (!cloudPlaylist) {
    // Create new playlist
    cloudPlaylist = await createCloudPlaylist(localPlaylist.name)
    if (!cloudPlaylist) return { success: false, uploadedTracks: 0 }
  }

  // Upload tracks
  let uploadedCount = 0
  const trackOrder: string[] = []

  for (const track of localPlaylist.tracks) {
    // Check if track already exists
    const { data: existingTrack } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', track.id)
      .single()

    if (!existingTrack) {
      const uploaded = await uploadTrackToCloud(cloudPlaylist.id, track)
      if (uploaded) {
        uploadedCount++
        trackOrder.push(uploaded.id)
      }
    } else {
      trackOrder.push(existingTrack.id)
    }
  }

  // Update track order
  await updateCloudPlaylist(cloudPlaylist.id, { 
    track_order: trackOrder,
    name: localPlaylist.name 
  })

  return { success: true, cloudPlaylist, uploadedTracks: uploadedCount }
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

export function downloadExportAsJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eqho-playlists-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
