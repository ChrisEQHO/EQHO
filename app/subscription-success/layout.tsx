import type { Metadata } from 'next'

// Private post-checkout route — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SubscriptionSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
