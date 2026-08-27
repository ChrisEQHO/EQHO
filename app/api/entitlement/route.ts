import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserFromRequest, evaluateForUser } from '@/lib/entitlement-server'

// Canonical entitlement check. The mobile/desktop client gate calls this to
// learn the server's decision instead of trusting its own clock. CORS-enabled
// so the Capacitor app (own origin, Bearer token) can call it cross-origin,
// exactly like /api/r2.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return json({ error: 'Auth not configured' }, 500)

  const user = await resolveUserFromRequest(request, supabase)
  if (!user) return json({ allowed: false, reason: 'unauthenticated' }, 401)

  const { result, profile } = await evaluateForUser(request, user)

  return json({
    allowed: result.allowed,
    phase: result.phase,
    reason: result.reason,
    status: profile?.subscription_status ?? 'free',
    trialEnd: profile?.trial_end ?? null,
    currentPeriodEnd: profile?.current_period_end ?? null,
  })
}
