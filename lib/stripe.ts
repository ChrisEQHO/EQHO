import 'server-only'

import Stripe from 'stripe'

// Lazily-created Stripe client. Instantiating `new Stripe(STRIPE_SECRET_KEY!)`
// at module scope throws `Neither apiKey nor config.authenticator provided`
// during `next build`'s "Collecting page data" step when the env isn't present
// at build time. The Proxy defers creation to first property access (request
// time), where the key is always available, while every `import { stripe }`
// caller keeps working unchanged.
let cachedStripe: Stripe | null = null

function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe is not configured: missing STRIPE_SECRET_KEY')
  }

  cachedStripe = new Stripe(key, {
    apiVersion: '2025-05-28.basil',
    typescript: true,
  })
  return cachedStripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})

// Subscription price - £4.99/month (EQHO Player)
// Set STRIPE_PRICE_ID in your Vercel environment variables
// This must be a real Stripe price ID starting with "price_"
export const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID || ''

export const SUBSCRIPTION_CONFIG = {
  name: 'EQHO Player',
  price: 499, // £4.99 in pence
  currency: 'gbp',
  interval: 'month' as const,
  trialDays: 14,
}
