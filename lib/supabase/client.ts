import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[v0] Supabase credentials not found. Auth features will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
