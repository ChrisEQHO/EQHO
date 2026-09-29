import { NextResponse } from 'next/server'
import { debugNotFound, resolveDebugAccess } from '@/lib/debug-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const access = await resolveDebugAccess()
  if (!access.allowed) return debugNotFound()

  // Booleans only: never return secret values, prefixes or IDs.
  const checks = {
    STRIPE_SECRET_KEY: { configured: !!process.env.STRIPE_SECRET_KEY },
    STRIPE_WEBHOOK_SECRET: { configured: !!process.env.STRIPE_WEBHOOK_SECRET },
    STRIPE_PRICE_ID: { configured: !!process.env.STRIPE_PRICE_ID },
    NEXT_PUBLIC_SUPABASE_URL: { configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    SUPABASE_SERVICE_ROLE_KEY: { configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    R2_BUCKET_NAME: { configured: !!process.env.R2_BUCKET_NAME },
  }

  const allConfigured = Object.values(checks).every((c) => c.configured)

  return NextResponse.json({
    status: allConfigured ? 'OK' : 'MISSING_CONFIG',
    checks,
  })
}
