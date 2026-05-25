import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#0c1e30] flex items-center justify-center p-4">
      {/* Background gradient effects - Sunset colorway */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#FF2D75]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#FF7A00]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-[#FFD21F]/10 to-[#8B60F6]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-[280px] h-[160px]">
            <Image
              src="/images/eqho-logo-sunset-full.png"
              alt="EQHO Player"
              fill
              priority
              className="object-contain mix-blend-lighten"
            />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          
          <p className="text-white/60 mb-6">
            Something went wrong during authentication. Please try again.
          </p>

          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2D75] via-[#FF7A00] to-[#FFD21F] text-white font-bold hover:shadow-[0_0_30px_rgba(255,122,0,0.4)] transition"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          EQHO Player - Professional Music Session Management
        </p>
      </div>
    </div>
  )
}
