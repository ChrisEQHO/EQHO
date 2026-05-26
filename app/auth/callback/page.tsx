'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      if (!supabase) {
        setError('Authentication service is not configured.')
        return
      }

      // Get the code from URL hash or search params
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const searchParams = new URLSearchParams(window.location.search)
      
      const code = searchParams.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const next = searchParams.get('next') ?? '/'

      try {
        if (code) {
          // PKCE flow - exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Auth callback error:', error.message)
            setError(error.message)
            return
          }
        } else if (accessToken && refreshToken) {
          // Implicit flow - set session from tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) {
            console.error('Auth callback error:', error.message)
            setError(error.message)
            return
          }
        } else {
          // No auth params found, check if already authenticated
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            setError('No authentication code found.')
            return
          }
        }

        // Success - redirect to destination
        router.replace(next)
      } catch (err) {
        console.error('Auth callback exception:', err)
        setError('Authentication failed. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-[#ff8a00] hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff8a00] mx-auto mb-4"></div>
        <p className="text-white/60">Completing authentication...</p>
      </div>
    </div>
  )
}
