import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CapacitorInit } from '@/components/capacitor-init'
import { SubscriptionProvider } from '@/lib/subscription-context'
import { getOfferCopy } from '@/lib/marketing-config'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

const siteUrl = 'https://www.eqho-player.com'

export function generateMetadata(): Metadata {
  // Date-driven so the social-share trial line never contradicts the live offer
  // phase. Pre-launch: free-until wording; from 1 Sep: the 30-day trial line.
  const offer = getOfferCopy()
  const shareTail = offer.preLaunch
    ? 'Free to use until 31 August 2026 — no card required.'
    : 'Includes a 30-day free trial.'
  return {
  // Resolves relative OG/canonical URLs (e.g. '/pricing') to absolute ones.
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EQHO Player - Training music player for coaches',
    template: '%s | EQHO Player',
  },
  description:
    'EQHO Player manages competition music during training for gymnastics coaches and clubs. Set the running order, gaps and repeats in around 30 seconds, then press play and coach the session.',
  applicationName: 'EQHO Player',
  keywords: [
    'gymnastics training music',
    'routine music player',
    'training session music',
    'gymnastics coach music app',
    'rhythmic gymnastics music',
    'competition music',
  ],
  icons: {
    // Single static favicon (transparent EQHO mark) for every build target.
    icon: '/favicon.png',
    apple: '/favicon.png',
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
  openGraph: {
    type: 'website',
    siteName: 'EQHO Player',
    title: 'EQHO Player - Training music player for coaches',
    description: `Set the running order, gaps and repeats in around 30 seconds, then press play and coach the session. ${shareTail}`,
    url: siteUrl,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'EQHO Player' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EQHO Player - Training music player for coaches',
    description:
      'Set the running order, gaps and repeats in around 30 seconds, then press play and coach the session.',
    images: ['/opengraph-image'],
  },
  }
}

export const viewport: Viewport = {
  // Accessibility: users MUST be able to pinch-zoom. Do not add maximumScale or
  // userScalable:false here — that disables zoom and fails WCAG 1.4.4.
  width: 'device-width',
  initialScale: 1,
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
        {/* Layout selection (runs before first paint).

            iPad renders at its REAL device width (device-width, 1:1) — no 1280px
            emulation. The old approach forced Safari to a fixed 1280px reference and
            zoomed-to-fit, which made every iPad (especially portrait) show the cramped
            desktop grid shrunk down. Now the responsive system does the work:

              • The `desktop:` CSS variant = (width >= 1024px) AND [data-desktop-layout].
              • We still set [data-desktop-layout] on iPad, so a LANDSCAPE iPad (>=1024px
                CSS width) gets the full multi-column desktop grid, while a PORTRAIT iPad
                (~768-834px, < 1024px) falls through the width gate to the proven mobile
                stacked layout. No separate tablet layout needed.

            True desktops (mouse, >=1024px) get [data-desktop-layout] + the grid; iPhones
            and Android phones never get the attribute and keep the phone stack. We do NOT
            override the viewport meta anymore — Next's `viewport` export already sets
            width=device-width, initial-scale=1, viewport-fit=cover for everyone, which is
            exactly what we want. The attribute is re-evaluated on resize/orientation and
            after DOMContentLoaded so desktop-window resizes stay reactive. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,n=navigator,ua=n.userAgent||'',mt=n.maxTouchPoints||0;var isIpad=/iPad/.test(ua)||((/Macintosh/.test(ua)||n.platform==='MacIntel')&&mt>1);var isPhoneOrTablet=/iPhone|iPod|Android|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);var apply=function(){if(isIpad){d.setAttribute('data-desktop-layout','');return}var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;if(!coarse&&!isPhoneOrTablet){d.setAttribute('data-desktop-layout','')}else{d.removeAttribute('data-desktop-layout')}};apply();document.addEventListener('DOMContentLoaded',apply);window.addEventListener('resize',apply,{passive:true});window.addEventListener('orientationchange',apply,{passive:true})}catch(e){}",
          }}
        />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.png" />
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
