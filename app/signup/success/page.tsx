import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #050816 0%, #07111f 45%, #0b1020 100%)' }}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-[280px] h-[160px]">
            <Image
              src="/eqho-player-logo.png"
              alt="EQHO Player"
              fill
              priority
              className="object-contain mix-blend-lighten"
            />
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-[#0b1220]/92 border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
          
          <p className="text-[#a7b0c0] mb-6">
            We&apos;ve sent you a confirmation link. Please check your email to verify your account and complete the signup process.
          </p>

          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[#6b7280] text-xs mt-6">
          EQHO Player - Professional Music Session Management
        </p>
      </div>
    </div>
  )
}
