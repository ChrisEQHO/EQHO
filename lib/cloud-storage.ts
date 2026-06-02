import { createClient } from '@/lib/supabase/client'

export interface CloudMusicFile {
  id: string
  name: string
  size: number
  created_at: string
  storage_path: string
  url: string
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
}

const BUCKET_NAME = 'music-files'

// Upload a music file to the cloud
export async function uploadMusicFile(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = createClient()
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  // Validate file type
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
    return { success: false, error: 'Only MP3 and WAV files are allowed' }
  }

  // Generate unique filename
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${userId}/${timestamp}-${sanitizedName}`

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Simulate progress complete
    if (onProgress) onProgress(100)

    return { success: true, path: data.path }
  } catch (err) {
    console.error('Upload exception:', err)
    return { success: false, error: 'Upload failed' }
  }
}

// List all music files for a user
export async function listUserMusicFiles(userId: string): Promise<CloudMusicFile[]> {
  const supabase = createClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('List error:', error)
      return []
    }

    if (!data || data.length === 0) return []

    // Get signed URLs for each file
    const files: CloudMusicFile[] = await Promise.all(
      data
        .filter(file => file.name.match(/\.(mp3|wav)$/i))
        .map(async (file) => {
          const storagePath = `${userId}/${file.name}`
          const { data: urlData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(storagePath, 3600) // 1 hour expiry

          return {
            id: file.id || file.name,
            name: file.name.replace(/^\d+-/, '').replace(/_/g, ' '),
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            storage_path: storagePath,
            url: urlData?.signedUrl || ''
          }
        })
    )

    return files.filter(f => f.url)
  } catch (err) {
    console.error('List exception:', err)
    return []
  }
}

// Delete a music file
export async function deleteMusicFile(storagePath: string): Promise<boolean> {
  const supabase = createClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Delete exception:', err)
    return false
  }
}

// Get a signed URL for playing a file
export async function getMusicFileUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600)

    if (error) {
      console.error('URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('URL exception:', err)
    return null
  }
}

// Download a file as blob for local playback
export async function downloadMusicFile(storagePath: string): Promise<File | null> {
  const supabase = createClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath)

    if (error) {
      console.error('Download error:', error)
      return null
    }

    // Extract original filename
    const fileName = storagePath.split('/').pop()?.replace(/^\d+-/, '') || 'track.mp3'
    
    return new File([data], fileName, { type: data.type || 'audio/mpeg' })
  } catch (err) {
    console.error('Download exception:', err)
    return null
  }
}
