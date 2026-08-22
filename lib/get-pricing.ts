import 'server-only'

import { stripe, PRO_PRICE_ID } from '@/lib/stripe'

export type LivePrice = {
  /** Pre-formatted amount incl. currency symbol, e.g. "£3.99". */
  formatted: string
  /** Billing interval word, e.g. "month" or "year". Empty for one-off. */
  interval: string
  /** True when the value came from Stripe (not the fallback). */
  live: boolean
}

/**
 * Fetch the current subscription price straight from Stripe so the marketing
 * pricing page always matches what customers are actually billed. Never throws —
 * on any failure (missing key, network, price not found) it returns a safe,
 * clearly-non-fabricated fallback so the page still renders.
 */
export async function getLivePrice(): Promise<LivePrice> {
  const fallback: LivePrice = { formatted: '', interval: '', live: false }

  try {
    if (!PRO_PRICE_ID || !PRO_PRICE_ID.startsWith('price_') || !process.env.STRIPE_SECRET_KEY) {
      return fallback
    }

    const price = await stripe.prices.retrieve(PRO_PRICE_ID)

    if (typeof price.unit_amount !== 'number' || !price.currency) {
      return fallback
    }

    const formatted = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: price.currency.toUpperCase(),
      // Stripe amounts are in the currency's minor unit (pence/cents).
      minimumFractionDigits: 2,
    }).format(price.unit_amount / 100)

    return {
      formatted,
      interval: price.recurring?.interval ?? '',
      live: true,
    }
  } catch (err) {
    console.error('[v0] getLivePrice failed, using fallback:', err)
    return fallback
  }
}
