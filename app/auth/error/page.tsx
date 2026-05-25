import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#030711] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fb3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a1c]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-[#ff4fb3] to-[#ff8a1c] bg-clip-text text-transparent">
            EQHO
          </h1>
        </div>

        {/* Error Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          
          <p className="text-white/60 mb-6">
            Something went wrong during authentication. Please try again.
          </p>

          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fb3] to-[#ff8a1c] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,179,0.4)] transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
