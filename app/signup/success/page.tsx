import Link from 'next/link'
import { Mail, Crown } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-white">EQHO Player</h1>
        </div>

        {/* Success Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
          
          <p className="text-[#cbd5e1] mb-4">
            We&apos;ve sent you a confirmation link. Please check your email to verify your account.
          </p>

          {/* Free Trial Info */}
          <div className="bg-gradient-to-r from-[#ff4fa3]/10 to-[#ff8a00]/10 border border-[#ff4fa3]/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#ff8a00]" />
              <span className="font-bold text-white">30-Day Free Pro Trial</span>
            </div>
            <p className="text-sm text-[#cbd5e1]">
              After confirming your email, you&apos;ll be redirected to start your free 30-day Pro trial with full access to cloud sync and all premium features.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[#7c8596] text-xs mt-6">
          EQHO Player - Professional Music Session Management
        </p>
      </div>
    </div>
  )
}
