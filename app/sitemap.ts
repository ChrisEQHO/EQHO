import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/marketing-config'

/**
 * Public sitemap.xml (served at /sitemap.xml).
 *
 * Only public, indexable marketing/legal pages are listed. The authenticated
 * player/account area and the hidden EQHO Music store are intentionally excluded.
 * When the store launches, add its URLs here and flip NEXT_PUBLIC_STORE_ENABLED.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    { path: '', priority: 1 },
    { path: '/features', priority: 0.8 },
    { path: '/how-it-works', priority: 0.7 },
    { path: '/who-its-for', priority: 0.7 },
    { path: '/pricing', priority: 0.8 },
    { path: '/faq', priority: 0.6 },
    { path: '/privacy-policy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
  ]

  return routes.map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: route.priority,
  }))
}
