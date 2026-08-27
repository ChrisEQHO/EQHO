import type { Metadata } from 'next'

// Private trial route — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children
}
