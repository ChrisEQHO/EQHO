import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for mobile/static builds - auth is handled client-side
  if (process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile') {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
