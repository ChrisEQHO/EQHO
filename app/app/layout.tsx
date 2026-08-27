import type { Metadata } from 'next'

// The authenticated player — private, keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return children
}
