import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/eqho-logo.png"
            alt="EQHO Player"
            width={150}
            height={150}
            priority
          />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#22c55e] text-white text-sm font-bold flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
            <span className="text-sm text-[#22c55e]">Account Created</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#ff4fa3] text-white text-sm font-bold flex items-center justify-center">2</span>
            <span className="text-sm text-[#ff4fa3]">Verify Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#64748b] text-white text-sm font-bold flex items-center justify-center">3</span>
            <span className="text-sm text-[#64748b]">Start Trial</span>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-[#94a3b8] mb-6">
            We&apos;ve sent you a confirmation link to verify your account.
          </p>

          {/* Next steps */}
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 mb-6 text-left">
            <p className="font-semibold text-[#22c55e] mb-3">What happens next:</p>
            <ol className="space-y-2 text-sm text-[#cbd5e1]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                Click the link in your email to verify your account
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                You&apos;ll be redirected to start your 14-day free trial
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                Enjoy full access to EQHO Player Pro!
              </li>
            </ol>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
          >
            Back to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[#64748b] text-xs mt-6">
          Didn&apos;t receive the email? Check your spam folder or try signing up again.
        </p>
      </div>
    </div>
  )
}
