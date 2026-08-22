'use client'

import { useEffect } from 'react'

/**
 * On the Capacitor static export the app's entry is '/' (index.html), but the
 * player now lives at '/app'. Middleware does NOT run in a static export, so the
 * mobile app would otherwise land on the marketing homepage. This component
 * bounces the WebView straight to /app on mount. It is only rendered when the
 * build target is mobile, so web builds never include this behaviour.
 */
export function MobileEntryRedirect() {
  useEffect(() => {
    window.location.replace('/app/')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff4fa3] border-t-transparent" />
    </div>
  )
}
