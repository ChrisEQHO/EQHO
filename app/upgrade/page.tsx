import { Suspense } from 'react'
import UpgradeClient from './upgrade-client'

function LoadingFallback() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--eqho-bg-app)' }}
    >
      <div className="animate-pulse text-white/50">Loading...</div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpgradeClient />
    </Suspense>
  )
}
