'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlayerClient from './player-client'

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      
      if (!supabase) {
        // Supabase not configured, redirect to login
        router.replace('/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // No authenticated user, redirect to login
        router.replace('/login')
      } else {
        // User is authenticated
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  // User is authenticated, render the player
  return <PlayerClient />
}
