'use client'

import { useEffect } from 'react'

/**
 * CapacitorInit - Initializes Capacitor plugins and native features
 * This component handles:
 * - Status bar configuration
 * - Splash screen hiding
 * - App lifecycle events
 * - Safe area detection
 */
export function CapacitorInit() {
  useEffect(() => {
    const initCapacitor = async () => {
      // Only run in Capacitor environment
      if (typeof window === 'undefined') return
      
      // Check if we're running in Capacitor
      const isCapacitor = 
        (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ?? false
      
      if (!isCapacitor) {
        // Running in web browser - add standalone mode class if PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
          document.documentElement.classList.add('standalone')
        }
        return
      }
      
      // Add capacitor class for native-specific styles
      document.documentElement.classList.add('capacitor')
      
      try {
        // Dynamically import Capacitor plugins
        const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
          import('@capacitor/splash-screen'),
          import('@capacitor/status-bar'),
        ])
        
        // Configure status bar for dark theme
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#020617' })
        
        // Hide splash screen after initialization
        await SplashScreen.hide()
        
        // Listen for app state changes
        const { App } = await import('@capacitor/app')
        
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App came to foreground
            document.documentElement.classList.remove('app-background')
          } else {
            // App went to background
            document.documentElement.classList.add('app-background')
          }
        })
        
        // Handle back button on Android
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            // At root, minimize app instead of closing
            App.minimizeApp()
          }
        })
        
      } catch (error) {
        console.warn('Capacitor plugins not available:', error)
      }
    }
    
    initCapacitor()
  }, [])
  
  // This component doesn't render anything
  return null
}

export default CapacitorInit
