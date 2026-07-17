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
        {/* Layout-split device detection. Runs before first paint so the correct
            layout (desktop grid vs mobile stack) renders immediately with no flash.
            Sets data-fine-pointer on <html> ONLY for true desktop-class devices; the
            CSS `desktop:` variant (globals.css) also requires width >= 1024px.

            iPad fix: an iPad with a Magic Keyboard/trackpad reports `pointer: fine`
            (NOT coarse), so a pointer-only test wrongly flagged it as desktop and sent
            landscape/large iPads into the desktop grid — whose footer space is a
            hardcoded 100px while the real wrapping control bar is ~140px, causing the
            Coach queue to sit under the session-controls bar. We therefore explicitly
            EXCLUDE iPadOS (incl. iPadOS masquerading as "Macintosh" with touch points)
            and other touch phones/tablets, so every iPad uses the mobile layout, which
            reserves the *measured* control-bar height and never overlaps. Desktop
            (mouse, non-touch) and iPhone (already <1024px) behaviour is unchanged.
            The attribute is outside React's tree and <html> has suppressHydrationWarning,
            so it never causes a hydration mismatch. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,n=navigator,ua=n.userAgent||'',mt=n.maxTouchPoints||0;var isIpad=/iPad/.test(ua)||((/Macintosh/.test(ua)||n.platform==='MacIntel')&&mt>1);var isPhoneOrTablet=/iPhone|iPod|Android|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;if(!coarse&&!isIpad&&!isPhoneOrTablet){d.setAttribute('data-fine-pointer','')}}catch(e){}",
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
