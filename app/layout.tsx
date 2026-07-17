import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CapacitorInit } from '@/components/capacitor-init'
import { SubscriptionProvider } from '@/lib/subscription-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

export const metadata: Metadata = {
  title: 'EQHO Player - Professional Music Player for Coaches',
  description: 'Premium DJ-style music player for gymnastics routines and training sessions',
  icons: {
    // Use static PNGs for mobile builds, dynamic routes for web
    icon: isMobileBuild ? '/icon.png' : '/icon',
    apple: isMobileBuild ? '/apple-icon.png' : '/apple-icon',
  },
  // PWA manifest for home screen installation
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EQHO Player',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#020617] overflow-x-hidden" suppressHydrationWarning>
      <head>
        {/* Layout-split pointer detection. Runs before first paint so the correct
            layout (desktop grid vs mobile stack) renders immediately with no flash.
            Sets data-fine-pointer on <html> for non-coarse (mouse/trackpad) pointers;
            iPads/phones report a coarse pointer and are left without it, so the CSS
            `desktop:` variant (see globals.css) routes them to the mobile layout. This
            attribute is not part of React's tree, and <html> has suppressHydrationWarning,
            so it never causes a hydration mismatch. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.matchMedia&&!window.matchMedia('(pointer: coarse)').matches){document.documentElement.setAttribute('data-fine-pointer','')}}catch(e){}",
          }}
        />
        <link rel="icon" href={isMobileBuild ? '/icon.png' : '/icon'} type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href={isMobileBuild ? '/apple-icon.png' : '/apple-icon'} />
        {/* iOS status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-[#020617] overflow-x-hidden w-screen max-w-[100vw] min-h-screen min-h-[100dvh]">
        <CapacitorInit />
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
        {process.env.NODE_ENV === 'production' && !isMobileBuild && <Analytics />}
        {process.env.NODE_ENV === 'production' && !isMobileBuild && <SpeedInsights />}
      </body>
    </html>
  )
}
