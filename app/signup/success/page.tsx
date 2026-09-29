import { Suspense } from 'react'
import { SignupSuccessContent } from './signup-success-content'

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#020617]" />}>
      <SignupSuccessContent />
    </Suspense>
  )
}
