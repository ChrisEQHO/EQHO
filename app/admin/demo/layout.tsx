import type { Metadata } from 'next'

// Administrator-only tooling — never index, never follow.
export const metadata: Metadata = {
  title: 'Demo setup',
  robots: { index: false, follow: false },
}

export default function AdminDemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
