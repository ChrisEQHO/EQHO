'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlayerClient from './player-client'

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    isMobileBuild ? true : null
  )
  const router = useRouter()

  useEffect(() => {
    // Skip auth check for mobile builds
    if (isMobileBuild) {
      return
    }

    const checkAuth = async () => {
      const supabase = createClient()
      
      if (!supabase) {
        router.replace('/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
      } else {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking auth (web only)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return <PlayerClient />
}
