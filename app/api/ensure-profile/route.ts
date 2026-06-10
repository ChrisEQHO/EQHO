import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'

/**
 * Ensures a public.profiles row exists for the currently authenticated user.
 * Derives the user from the session cookie (anon client + getUser), then
 * performs the insert-if-missing with the service-role helper.
 *
 * Safe to call repeatedly: existing profiles (including paid ones) are never
 * overwritten.
 */
export async function POST() {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase unavailable' }, { status: 500 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('[v0][api/ensure-profile] No authenticated user', authError?.message)
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const result = await ensureUserProfile({
    userId: user.id,
    email: user.email,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? '',
  })

  const status = result.ok ? 200 : 500
  return NextResponse.json(result, { status })
}
