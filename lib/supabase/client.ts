import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging in development only (does not print actual keys)
  if (process.env.NODE_ENV === 'development') {
    console.log('[v0] Supabase config check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[v0] Supabase credentials not found. NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, 'NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
