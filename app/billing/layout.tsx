import type { Metadata } from 'next'

// Private account/billing route — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children
}
