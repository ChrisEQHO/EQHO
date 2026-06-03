'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
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
    
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Log the account deletion in a deleted_accounts table
    const { error: logError } = await supabase
      .from('deleted_accounts')
      .insert({
        user_id: user.id,
        email: user.email,
        deleted_at: new Date().toISOString(),
      })

    if (logError) {
      // If the table doesn't exist, continue anyway - the deletion should still proceed
      console.error('Failed to log account deletion:', logError)
    }

    // Delete user data from profiles table
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id)

    // Delete user's cloud playlists
    await supabase
      .from('cloud_playlists')
      .delete()
      .eq('user_id', user.id)

    // Delete user's cloud tracks
    await supabase
      .from('cloud_tracks')
      .delete()
      .eq('user_id', user.id)

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
      
      if (deleteError) {
        console.error('Failed to delete user from auth:', deleteError)
        return { success: false, error: 'Failed to delete account. Please try again.' }
      }
    }

    // Sign out the user
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Account deletion error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
