import type { Metadata } from 'next'

// Private/auth route — keep it out of search indexes. robots.txt already
// disallows it, but a noindex meta is the authoritative belt-and-braces for
// pages that might still be linked externally.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
