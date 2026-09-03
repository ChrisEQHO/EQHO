import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * Returns whether an email already has a profile (account) and whether that
 * account currently has Pro access (subscription_status of trialing/active).
 * Used by the signup flow to redirect an existing user correctly.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    console.log('[v0] check-email called for:', email)

    const supabaseAdmin = getSupabaseAdmin()

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_status')
      .ilike('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.log('[v0] check-email lookup error:', error.message)
    }

    const exists = !!profile
    const hasAccess =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    console.log('[v0] check-email result:', { exists, hasAccess, status: profile?.subscription_status ?? null })

    return NextResponse.json({ exists, hasAccess })
  } catch (error) {
    console.error('[v0] check-email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
