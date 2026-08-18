import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Mobile (Capacitor iOS/Android) runs as a static export served from
// capacitor://localhost / http://localhost, where cookies are NOT reliably
// persisted by the WebView. The web app, however, relies on cookie-based auth so
// that middleware and server routes can read the session. So we branch:
//   - Web:    createBrowserClient (@supabase/ssr) -> cookie storage
//   - Mobile: createClient (@supabase/supabase-js) -> localStorage storage
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

// Keep exactly one client per browser page for BOTH build targets.
//
// This is more than an optimisation. Components call createClient() while
// rendering and use the returned object in effect dependency arrays. Returning
// a new @supabase/ssr client on every web render repeatedly tears down and
// restarts the auth bootstrap. On slower WebKit devices (most visibly iPad
// Safari) that race can prevent the bootstrap from ever committing and leave
// the player on "Checking your access…" indefinitely.
//
// A singleton also guarantees one persisted session and one token-refresh
// timer in Capacitor instead of competing auth listeners.
let mobileClient: SupabaseClient | null = null
let browserClient: SupabaseClient | null = null

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

  if (browserClient) return browserClient
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

