import 'server-only'

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Pro subscription price - £3.99/month
// This should match the Price ID created in your Stripe Dashboard
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly'

export const SUBSCRIPTION_CONFIG = {
  name: 'EQHO Player Pro',
  price: 399, // £3.99 in pence
  currency: 'gbp',
  interval: 'month' as const,
  trialDays: 30,
}
