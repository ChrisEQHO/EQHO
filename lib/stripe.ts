import 'server-only'

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Pro subscription price - £47.90/year (EQHO Player Pro)
// Set STRIPE_PRICE_ID in your Vercel environment variables
// This must be a real Stripe price ID starting with "price_"
export const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID || ''

export const SUBSCRIPTION_CONFIG = {
  name: 'EQHO Player Pro',
  price: 4790, // £47.90 in pence
  currency: 'gbp',
  interval: 'year' as const,
  trialDays: 14,
}
