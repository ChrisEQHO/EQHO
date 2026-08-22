import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MarketingHome } from '@/components/marketing/marketing-home'
import { MobileEntryRedirect } from '@/components/marketing/mobile-entry-redirect'
import { SITE } from '@/lib/marketing-config'

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
}

export default function HomePage() {
  // On the mobile (Capacitor) build there is no middleware and the WebView opens
  // at '/', so send it straight to the player instead of the marketing site.
  if (isMobileBuild) {
    return <MobileEntryRedirect />
  }

  return (
    <>
      <SiteHeader />
      <MarketingHome />
      <SiteFooter />
    </>
  )
}
