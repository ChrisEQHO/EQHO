'use client'

import { useEffect } from 'react'

// Module-level guards: a full WebView reload re-creates the module, but React
// Strict Mode / remounts within one page must not hide the splash or register
// native listeners twice.
let splashHidden = false
let listenersRegistered = false

/**
 * CapacitorInit - Initializes Capacitor plugins and native features
 * This component handles:
 * - Splash screen hiding (exactly once, before anything that can fail)
 * - Status bar configuration
 * - App lifecycle events
 */
export function CapacitorInit() {
  useEffect(() => {
    const initCapacitor = async () => {
      if (typeof window === 'undefined') return

      const isCapacitor =
        (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ?? false

      if (!isCapacitor) {
        if (window.matchMedia('(display-mode: standalone)').matches) {
          document.documentElement.classList.add('standalone')
        }
        return
      }

      document.documentElement.classList.add('capacitor')

      // Hide the splash FIRST and in isolation. Previously it ran after
      // StatusBar.setBackgroundColor, which is Android-only and rejects on iOS,
      // so on iPad the hide was skipped and only the native auto-hide saved us.
      if (!splashHidden) {
        splashHidden = true
        try {
          const { SplashScreen } = await import('@capacitor/splash-screen')
          await SplashScreen.hide()
        } catch (error) {
          console.warn('[capacitor] splash hide failed:', error)
        }
      }

      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Dark })
      } catch (error) {
        console.warn('[capacitor] status bar style failed:', error)
      }
      try {
        const { StatusBar } = await import('@capacitor/status-bar')
        await StatusBar.setBackgroundColor({ color: '#020617' })
      } catch {
        // Android-only API; expected to reject on iOS.
      }

      if (listenersRegistered) return
      listenersRegistered = true
      try {
        const { App } = await import('@capacitor/app')

        App.addListener('appStateChange', ({ isActive }) => {
          document.documentElement.classList.toggle('app-background', !isActive)
        })

        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            App.minimizeApp()
          }
        })
      } catch (error) {
        listenersRegistered = false
        console.warn('[capacitor] app listeners unavailable:', error)
      }
    }

    initCapacitor()
  }, [])

  return null
}

export default CapacitorInit
