import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/eqho-logo.png" alt="EQHO Player" width={100} height={100} priority />
        </div>

        {/* Step indicator - compact */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#22c55e] text-white text-xs font-bold flex items-center justify-center">
              <CheckCircle className="w-3 h-3" />
            </span>
            <span className="text-xs text-[#22c55e]">Created</span>
          </div>
          <div className="w-4 h-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#ff4fa3] text-white text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-xs text-[#ff4fa3]">Verify</span>
          </div>
          <div className="w-4 h-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#64748b] text-white text-xs font-bold flex items-center justify-center">3</span>
            <span className="text-xs text-[#64748b]">Trial</span>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
            <Mail className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-[#94a3b8] mb-3">
            We&apos;ve sent you a confirmation link to verify your account.
          </p>
          <p className="text-xs text-[#facc15] mb-4">
            The email may take up to 5 minutes to arrive.
          </p>

          {/* Next steps - compact */}
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-3 mb-4 text-left">
            <p className="font-semibold text-sm text-[#22c55e] mb-2">What happens next:</p>
            <ol className="space-y-1.5 text-xs text-[#cbd5e1]">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                Click the link in your email to verify
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                Start your 14-day free trial
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                Enjoy EQHO Player!
              </li>
            </ol>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(255,79,163,0.4)] transition"
          >
            Back to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[#64748b] text-xs mt-4">
          Didn&apos;t receive the email? Check spam or try signing up again.
        </p>
      </div>
    </div>
  )
}
