import type { Metadata } from 'next'

// EQHO Music store — hidden pre-launch, so keep it (and its [slug] pages) out of
// search indexes until it is ready to go public.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children
}
