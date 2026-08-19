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
        {/* Select the existing desktop grid for true desktops and landscape iPads;
            keep the existing phone stack for iPhones and portrait iPads. The
            attribute is updated when Safari changes orientation/viewport, so no
            reload is required. CSS still requires a width of at least 1024px. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,n=navigator,ua=n.userAgent||'',mt=n.maxTouchPoints||0;var isIpad=/iPad/.test(ua)||((/Macintosh/.test(ua)||n.platform==='MacIntel')&&mt>1);var isPhoneOrTablet=/iPhone|iPod|Android|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);var apply=function(){var landscape=window.innerWidth>window.innerHeight;var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;var desktop=(!coarse&&!isIpad&&!isPhoneOrTablet)||(isIpad&&landscape);if(desktop){d.setAttribute('data-desktop-layout','')}else{d.removeAttribute('data-desktop-layout')}};apply();window.addEventListener('resize',apply,{passive:true});window.addEventListener('orientationchange',apply,{passive:true})}catch(e){}",
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
