import { createBrowserClient } from '@supabase/ssr'

// Create a singleton instance for the browser client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // In production, this means env vars are not set
    // Return null so the app can handle gracefully
    return null
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
