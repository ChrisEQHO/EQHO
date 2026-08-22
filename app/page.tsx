import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MarketingHome } from '@/components/marketing/marketing-home'
import { MobileEntryRedirect } from '@/components/marketing/mobile-entry-redirect'
import { SITE, FAQ } from '@/lib/marketing-config'

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

  // Structured data so search engines understand the product and can surface the
  // FAQ as rich results. Built from the same marketing config as the visible page,
  // so it never drifts from the on-page content.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
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
          description: 'Free to use until 31 August.',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
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
