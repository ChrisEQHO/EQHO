'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// STRIPE TEMPORARILY DISABLED - Redirect straight to player

export default function TrialPage() {
  const router = useRouter()

  useEffect(() => {
    // Stripe disabled - just redirect to the main player (now at /app)
    router.replace('/app')
  }, [router])

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff4fa3] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
