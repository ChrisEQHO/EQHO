import type { Metadata } from 'next'

// Private/auth route — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CompleteSignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
