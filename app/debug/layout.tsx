import { notFound } from 'next/navigation'
import { resolveDebugAccess } from '@/lib/debug-guard'

export const dynamic = 'force-dynamic'

export default async function DebugLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveDebugAccess()
  if (!access.allowed) notFound()
  return <>{children}</>
}
