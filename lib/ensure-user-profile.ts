import { createClient } from '@supabase/supabase-js'

/**
 * Service-role admin client. Bypasses RLS so we can guarantee a profile row
 * exists for every authenticated user. NEVER import this into client code.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[v0][ensureUserProfile] Missing Supabase env vars', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
    })
    return null
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type EnsureProfileResult = {
  ok: boolean
  action: 'exists' | 'created' | 'error' | 'skipped'
  profile?: Record<string, unknown> | null
  error?: { message?: string; code?: string; details?: string }
}

/**
 * Guarantees a public.profiles row exists for the given authenticated user.
 *
 * - Uses user.id as profiles.id (primary key, FK -> auth.users.id)
 * - Uses user.email as profiles.email
 * - Inserts a default 'free' profile if missing
 * - NEVER overwrites existing data (so paid subscription data is preserved)
 */
export async function ensureUserProfile(params: {
  userId: string
  email: string | null | undefined
  fullName?: string | null
}): Promise<EnsureProfileResult> {
  const { userId, email, fullName } = params

  if (!userId) {
    console.warn('[v0][ensureUserProfile] Called without userId; skipping')
    return { ok: false, action: 'skipped' }
  }

  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) {
    return { ok: false, action: 'error', error: { message: 'Supabase admin client unavailable' } }
  }

  // 1. If a row already exists for this auth id, do nothing (preserve paid data).
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, subscription_status, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle()

  if (lookupError) {
    console.error('[v0][ensureUserProfile] Lookup error', {
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
      userId,
    })
    // Continue to attempt insert; lookup failure shouldn't block creation.
  }

  if (existing) {
    console.log('[v0][ensureUserProfile] Profile already exists, preserving:', {
      id: existing.id,
      subscription_status: existing.subscription_status,
    })
    return { ok: true, action: 'exists', profile: existing }
  }

  // 2. No row -> insert the default free profile.
  const nowIso = new Date().toISOString()
  const payload = {
    id: userId,
    email: email ? email.toLowerCase() : null,
    full_name: fullName || '',
    plan: 'free',
    subscription_status: 'free',
    trial_active: false,
    created_at: nowIso,
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert(payload)
    .select('id, email, plan, subscription_status')
    .single()

  if (insertError) {
    // If the row was created concurrently (e.g. by a DB trigger), treat as success.
    if (insertError.code === '23505') {
      console.log('[v0][ensureUserProfile] Row already created concurrently (unique violation), treating as exists')
      return { ok: true, action: 'exists' }
    }

    console.error('[v0][ensureUserProfile] INSERT FAILED', {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      attemptedPayload: payload,
    })
    return {
      ok: false,
      action: 'error',
      error: {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
      },
    }
  }

  console.log('[v0][ensureUserProfile] Created default free profile for:', userId)
  return { ok: true, action: 'created', profile: inserted }
}
