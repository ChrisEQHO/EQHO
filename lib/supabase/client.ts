import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL:", supabaseUrl ? "SET" : "NOT SET")
  console.log("[v0] Supabase Anon Key:", supabaseAnonKey ? "SET" : "NOT SET")

  if (!supabaseUrl || !supabaseAnonKey) {
    // Environment variables are not set
    console.log("[v0] Supabase client returning null - env vars missing")
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
