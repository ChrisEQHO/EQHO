import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Mobile (Capacitor iOS/Android) runs as a static export served from
// capacitor://localhost / http://localhost, where cookies are NOT reliably
// persisted by the WebView. The web app, however, relies on cookie-based auth so
// that middleware and server routes can read the session. So we branch:
//   - Web:    createBrowserClient (@supabase/ssr) -> cookie storage
//   - Mobile: createClient (@supabase/supabase-js) -> localStorage storage
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

// Memoize the mobile client so every createClient() call shares one instance
// (and therefore one persisted session + one auth-refresh timer).
let mobileClient: SupabaseClient | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Environment variables are not set
    return null
  }

  if (isMobileBuild) {
    if (mobileClient) return mobileClient
    mobileClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persist the session in the WebView's localStorage and keep it fresh so
        // the user stays logged in after closing/reopening the iPhone app.
        persistSession: true,
        autoRefreshToken: true,
        // Static export has no auth-callback URL to parse, so don't try.
        detectSessionInUrl: false,
        storageKey: 'eqho-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
    return mobileClient
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
