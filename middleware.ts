import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public interactive demo endpoint: it must be reachable by logged-out
  // visitors on /features. Short-circuit BEFORE updateSession runs, so the
  // unauthenticated /login redirect can never intercept it. Scoped to the demo
  // API only (exact '/api/demo' plus the '/api/demo/' prefix); it does not make
  // any other route public, and routes beneath /api/demo/ still enforce their
  // own auth internally.
  if (pathname === "/api/demo" || pathname.startsWith("/api/demo/")) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  // Skip the middleware entirely for framework internals and PUBLIC static assets
  // so they are never gated/redirected to /login. This matters for logged-out and
  // credential-less fetches: the PWA manifest, service worker, icons, favicons and
  // the SEO files (robots.txt / sitemap.xml) must return their real content, not an
  // auth redirect. Everything else still runs through updateSession.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|manifest.webmanifest|robots.txt|sitemap.xml|sw.js|downloads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff|woff2|ttf|mp3|wav)$).*)",
  ],
}
