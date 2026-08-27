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

            iPad web player === desktop web player (product requirement). iPad Safari
            can't fit the fixed-column desktop grid at its native CSS width, so instead
            of a separate tablet layout we make Safari render the FULL desktop layout at
            a fixed 1280px reference width and zoom-to-fit. Result: the exact desktop
            grid, columns and breakpoints (xl matches at 1280), just scaled to the iPad
            screen — identical look AND behaviour, both orientations.

            Mechanism: overwrite the viewport meta with `width=1280` (NO initial-scale,
            or Safari would refuse to shrink and add horizontal scroll) and always set
            [data-desktop-layout]. We overwrite EVERY viewport meta so Next's own
            `viewport` export (which sets initial-scale=1) can't re-introduce 1:1.

            True desktops keep device-width + the desktop grid; iPhones/Android keep the
            phone stack. The attribute + viewport are re-applied on resize/orientation
            and after DOMContentLoaded (so the framework's meta is overwritten too). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,n=navigator,ua=n.userAgent||'',mt=n.maxTouchPoints||0;var isIpad=/iPad/.test(ua)||((/Macintosh/.test(ua)||n.platform==='MacIntel')&&mt>1);var isPhoneOrTablet=/iPhone|iPod|Android|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);var setVP=function(c){var l=document.querySelectorAll('meta[name=viewport]');if(!l.length){var m=document.createElement('meta');m.setAttribute('name','viewport');m.setAttribute('content',c);(document.head||d).appendChild(m);return}for(var i=0;i<l.length;i++){if(l[i].getAttribute('content')!==c){l[i].setAttribute('content',c)}}};var apply=function(){if(isIpad){setVP('width=1280, viewport-fit=cover');d.setAttribute('data-desktop-layout','');return}var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;if(!coarse&&!isPhoneOrTablet){d.setAttribute('data-desktop-layout','')}else{d.removeAttribute('data-desktop-layout')}};apply();document.addEventListener('DOMContentLoaded',apply);window.addEventListener('resize',apply,{passive:true});window.addEventListener('orientationchange',apply,{passive:true})}catch(e){}",
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
