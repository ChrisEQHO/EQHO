import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Lazily-created Supabase admin client (service role, bypasses RLS).
 *
 * IMPORTANT: This must NOT be instantiated at module scope. Doing so runs
 * `createClient(...)` during `next build`'s "Collecting page data" step, which
 * throws `supabaseUrl is required` whenever the env is not present at build
 * time. Creating it lazily inside the request handler defers that to runtime,
 * where the env vars are always available, so the production build never fails.
 */
let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client is not configured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  cached = createClient(url, serviceRoleKey)
  return cached
}
