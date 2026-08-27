/**
 * Feature flag for the EQHO Music marketplace.
 *
 * The store (browse, track detail, checkout, catalogue and DB) is fully built but
 * intentionally HIDDEN from customers pre-launch. Nothing is deleted — flipping
 * this flag on re-enables the public `/store` routes, and you should also restore
 * the "Music store" links in `lib/marketing-config.ts` (NAV_LINKS + FOOTER_LINKS)
 * and add the store URLs back into `app/sitemap.ts`.
 *
 * Enable by setting `NEXT_PUBLIC_STORE_ENABLED=true` in the project environment.
 * Defaults to DISABLED so an unset/removed variable keeps the store hidden.
 */
export function isStoreEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STORE_ENABLED === 'true'
}
