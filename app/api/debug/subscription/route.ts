import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { debugNotFound, resolveDebugAccess } from '@/lib/debug-guard'

export const dynamic = 'force-dynamic'

// Reports ONLY the caller's own subscription state. Admin-only in production.
export async function GET() {
  const access = await resolveDebugAccess()
  if (!access.allowed) return debugNotFound()
  if (!access.userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, plan, trial_end, current_period_end, updated_at')
      .eq('id', access.userId)
      .maybeSingle()

    const accessAllowed =
      profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'

    return NextResponse.json({
      authenticated: true,
      profileFound: !!profile,
      profile: profile ?? null,
      profileError: profileError ? 'lookup_failed' : null,
      accessAllowed,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
