import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'EQHO Player - Professional Music Player for Coaches',
  description: 'Premium DJ-style music player for gymnastics routines and training sessions',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#020817]">
      <head>
        <link rel="icon" href="/icon" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon" />
      </head>
      <body className="font-sans antialiased bg-[#020817]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  )
}
export const metadata = {
  title: "EQHO Player",
  description: "EQHO Player dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};/public
export const metadata = {
  title: "EQHO Player",
  description: "EQHO Player dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};
app/favicon.ico
