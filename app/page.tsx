import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlayerClient from './player-client'

export default async function Page() {
  const supabase = await createClient()
  
  if (!supabase) {
    // Supabase not configured, redirect to login
    redirect('/login')
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // No authenticated user, redirect to login
    redirect('/login')
  }

  // User is authenticated, render the player
  return <PlayerClient />
}
