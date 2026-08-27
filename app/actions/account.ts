'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { deleteAllUserObjects } from '@/lib/r2-admin'

/**
 * Permanently delete the signed-in user's account and all associated data.
 *
 * Security: the target user is ALWAYS derived from the server-verified session
 * (supabase.auth.getUser()). No user id is ever accepted from the client, so a
 * caller cannot delete another account.
 *
 * Order matters — we read Stripe/DB references BEFORE deleting the rows that hold
 * them, then remove external data (Stripe, R2) before the account record:
 *   1. Resolve the session user.
 *   2. Cancel the Stripe subscription (so billing stops immediately).
 *   3. Delete every R2 audio object under users/{id}/.
 *   4. Delete Supabase rows (cloud_tracks, cloud_playlists, profiles).
 *   5. Delete the Supabase Auth user (requires the service role key).
 *   6. Sign out.
 *
 * External steps (Stripe, R2) are best-effort: a failure there is logged but does
 * not block account removal, because leaving the user unable to delete their
 * account is worse than an orphaned external record we can clean up later. The
 * account is only reported deleted when the Auth user is actually removed.
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[v0] deleteAccount called')

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Missing Supabase configuration' }
  }

  // Deleting the Auth user requires the service role key. Without it we can only
  // wipe data but not the login itself, which would leave a "deleted" account
  // that can still sign in — so we refuse rather than half-delete.
  if (!supabaseServiceKey) {
    console.error('[v0] deleteAccount: SUPABASE_SERVICE_ROLE_KEY is not configured')
    return {
      success: false,
      error: 'Account deletion is temporarily unavailable. Please contact support.',
    }
  }

  try {
    const cookieStore = await cookies()

    // Session-scoped client — used ONLY to identify the caller securely.
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignore cookie setting errors
          }
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = user.id
    console.log('[v0] deleteAccount: deleting user', userId)

    // Admin client (service role) for privileged reads/deletes that bypass RLS.
    const { createClient } = await import('@supabase/supabase-js')
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 2) Cancel the Stripe subscription (best-effort). Read the id from the
    //    profile BEFORE we delete the row.
    try {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .maybeSingle()

      const subscriptionId = profile?.stripe_subscription_id as string | null | undefined
      if (subscriptionId) {
        await stripe.subscriptions.cancel(subscriptionId)
        console.log('[v0] deleteAccount: cancelled Stripe subscription', subscriptionId)
      }
    } catch (stripeErr) {
      // Already-cancelled subscriptions throw — that is fine, billing is stopped.
      console.warn('[v0] deleteAccount: Stripe cancellation skipped/failed:', stripeErr)
    }

    // 3) Delete every R2 object owned by the user (best-effort).
    const r2Result = await deleteAllUserObjects(userId)
    console.log('[v0] deleteAccount: R2 cleanup', r2Result)

    // 4) Delete Supabase data rows (service role bypasses RLS so this is reliable).
    const { error: trackError } = await adminClient.from('cloud_tracks').delete().eq('user_id', userId)
    if (trackError) console.warn('[v0] deleteAccount: cloud_tracks delete error:', trackError.message)

    const { error: playlistError } = await adminClient
      .from('cloud_playlists')
      .delete()
      .eq('user_id', userId)
    if (playlistError) console.warn('[v0] deleteAccount: cloud_playlists delete error:', playlistError.message)

    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', userId)
    if (profileError) console.warn('[v0] deleteAccount: profiles delete error:', profileError.message)

    // 5) Delete the Auth user. This is the step that truly removes the account.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[v0] deleteAccount: auth user delete failed:', deleteError)
      return {
        success: false,
        error: 'We could not fully delete your account. Please contact support.',
      }
    }

    // 6) Clear the local session cookies.
    try {
      await supabase.auth.signOut()
    } catch {
      // Session is already invalid once the user is gone — safe to ignore.
    }

    console.log('[v0] deleteAccount: completed for', userId)
    return { success: true }
  } catch (error) {
    console.error('[v0] Account deletion error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Missing Supabase configuration' }
  }

  try {
    const cookieStore = await cookies()
    
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

    await supabase.auth.signOut()
    
    console.log('[v0] User signed out successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Sign out error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
