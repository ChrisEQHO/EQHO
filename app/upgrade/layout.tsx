import type { Metadata } from 'next'

// Paywall/subscribe screen — private, keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children
}
