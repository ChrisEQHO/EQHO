import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/marketing-config'

/**
 * Public robots.txt (served at /robots.txt).
 *
 * IMPORTANT: /robots.txt and /sitemap.xml must be reachable WITHOUT auth. They are
 * added to the public-routes allowlist in `lib/supabase/middleware.ts` so the auth
 * middleware never redirects crawlers to /login for these files.
 *
 * Public, indexable pages: homepage, features, pricing, privacy policy, terms.
 * Everything else — the authenticated player/account area, auth flows, API routes,
 * and the hidden EQHO Music store — is disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app',
          '/billing',
          '/login',
          '/signup',
          '/complete-signup',
          '/forgot-password',
          '/reset-password',
          '/auth/',
          '/trial',
          '/upgrade',
          '/subscription-success',
          '/subscription/success',
          '/debug',
          '/api/',
          '/store', // EQHO Music marketplace — hidden pre-launch
          // EQHO Music unfinished marketplace child routes — the public /music
          // coming-soon page IS indexable, but these prototype routes are not
          // part of the public surface yet.
          '/music/browse',
          '/music/creators',
          '/music/creator',
          '/music/track',
          '/music/basket',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
