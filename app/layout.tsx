import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#020617] overflow-x-hidden">
      <head>
        <link rel="icon" href={isMobileBuild ? '/icon.png' : '/icon'} type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href={isMobileBuild ? '/apple-icon.png' : '/apple-icon'} />
      </head>
      <body className="font-sans antialiased bg-[#020617] overflow-x-hidden w-screen max-w-[100vw]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  )
}
