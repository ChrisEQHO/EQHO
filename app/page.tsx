import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MarketingHome } from '@/components/marketing/marketing-home'
import { MobileEntryRedirect } from '@/components/marketing/mobile-entry-redirect'
import { SITE, getOfferCopy } from '@/lib/marketing-config'

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

const HOME_TITLE = `Training Session Music App for Coaches | ${SITE.name}`
const HOME_DESCRIPTION =
  'The training session music app for gymnastics coaches and clubs. Set the running order, gaps and repeats once, sync to every device and play offline.'

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
}

export default function HomePage() {
  // On the mobile (Capacitor) build there is no middleware and the WebView opens
  // at '/', so send it straight to the player instead of the marketing site.
  if (isMobileBuild) {
    return <MobileEntryRedirect />
  }

  // Structured data so search engines understand the product and can surface the
  // FAQ as rich results. Built from the same marketing config as the visible page,
  // so it never drifts from the on-page content.
  const offer = getOfferCopy()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web, iOS, Android',
    description: SITE.description,
    url: SITE.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
      description: offer.preLaunch
        ? 'Free to use until 1 October 2026. No card required.'
        : 'Includes a 30-day free trial.',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <MarketingHome />
      <SiteFooter />
    </>
  )
}
