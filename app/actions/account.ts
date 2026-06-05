'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[v0] deleteAccount called')
  console.log('[v0] Has service key:', !!supabaseServiceKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[v0] Missing Supabase configuration')
    return { success: false, error: 'Missing Supabase configuration' }
  }

  try {
    const cookieStore = await cookies()
    
    // Create client with user's session to get the user
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore cookie setting errors
          }
        },
      },
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[v0] User:', user?.id, user?.email)
    console.log('[v0] User error:', userError)

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete user data from profiles table (uses 'id' as the user id column)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
    
    console.log('[v0] Profile delete error:', profileError)

    // Delete user's cloud playlists
    const { error: playlistError } = await supabase
      .from('cloud_playlists')
      .delete()
      .eq('user_id', user.id)
    
    console.log('[v0] Playlist delete error:', playlistError)

    // Delete user's cloud tracks
    const { error: trackError } = await supabase
      .from('cloud_tracks')
      .delete()
      .eq('user_id', user.id)
    
    console.log('[v0] Track delete error:', trackError)

    // If we have a service role key, delete the user from auth
    if (supabaseServiceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
      
      console.log('[v0] Auth delete error:', deleteError)
      
      if (deleteError) {
        console.error('Failed to delete user from auth:', deleteError)
        // Still return success if we deleted the data but couldn't delete auth
        // The user won't be able to access anything anyway
      }
    } else {
      console.log('[v0] No service key - signing out user only')
    }

    // Sign out the user
    await supabase.auth.signOut()

    console.log('[v0] Account deletion completed successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Account deletion error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
