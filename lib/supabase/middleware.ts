import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simple middleware that allows all requests to pass through
  // Auth checking is done client-side in the app
  const response = NextResponse.next({
    request,
  })

  return response
}
