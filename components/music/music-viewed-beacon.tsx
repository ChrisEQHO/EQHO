'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/track-event'

/**
 * Fires a single anonymous "Music Page Viewed" analytics event when the public
 * EQHO Music coming-soon page mounts. Renders nothing. Analytics is gated to the
 * production web build inside trackEvent, so this is a no-op in dev/preview and
 * on the mobile build.
 */
export function MusicViewedBeacon() {
  useEffect(() => {
    trackEvent('Music Page Viewed')
  }, [])

  return null
}
