import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/access'

export type DebugAccess =
  | { allowed: true; userId: string | null; email: string | null }
  | { allowed: false }

type AuthLookup = () => Promise<{ id: string; email: string | null } | null>

async function lookupServerUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}

/**
 * Debug tooling is admin-only in production. Outside production, any
 * authenticated user may use it (and unauthenticated access is still allowed
 * for env-only checks so local setup can be diagnosed).
 */
export async function resolveDebugAccess(
  env: string | undefined = process.env.NODE_ENV,
  lookupUser: AuthLookup = lookupServerUser
): Promise<DebugAccess> {
  const user = await lookupUser().catch(() => null)
  if (env !== 'production') {
    return { allowed: true, userId: user?.id ?? null, email: user?.email ?? null }
  }
  if (user && isAdminEmail(user.email)) {
    return { allowed: true, userId: user.id, email: user.email }
  }
  return { allowed: false }
}

export function debugNotFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
