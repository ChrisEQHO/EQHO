'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      {/* Background gradient effects - Sunset colorway */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#FF2D75]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#FF7A00]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-[#FFD21F]/10 to-[#8B60F6]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo - Sunset colorway */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-[220px] h-[140px] mb-2">
            <Image
              src="/images/eqho-logo-sunset-full.png"
              alt="EQHO Player"
              fill
              priority
              className="object-contain mix-blend-lighten"
            />
          </div>
          <p className="text-white/50 text-sm">Welcome back to your session</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7A00]/50 focus:ring-1 focus:ring-[#FF7A00]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7A00]/50 focus:ring-1 focus:ring-[#FF7A00]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-[#FF2D75] via-[#FF7A00] to-[#FFD21F] text-white font-bold hover:shadow-[0_0_30px_rgba(255,122,0,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#FF7A00] hover:text-[#FFD21F] font-medium transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          EQHO Player - Professional Music Session Management
        </p>
      </div>
    </div>
  )
}
