import 'server-only'

import Stripe from 'stripe'

export type LivePrice = {
  /** Pre-formatted amount incl. currency symbol, e.g. "£4.99". */
  formatted: string
  /** Billing interval word, e.g. "month" or "year". Empty for one-off. */
  interval: string
  /** True when the value came from Stripe (not the fallback). */
  live: boolean
}

// Documented default price (£4.99/month GBP). Used ONLY when the live Stripe price
// can't be loaded. This is a real, intended price — not a fabricated placeholder —
// so the page stays honest if the live lookup fails.
const FALLBACK_AMOUNT_MINOR = 499
const FALLBACK_CURRENCY = 'gbp'
const FALLBACK_INTERVAL = 'month'

function format(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    // Stripe amounts are in the currency's minor unit (pence/cents).
    minimumFractionDigits: 2,
  }).format(amountMinor / 100)
}

/**
 * Fetch the current subscription price straight from Stripe so the marketing
 * pricing page always matches what customers are actually billed. Never throws —
 * on any failure (missing key, network, price not found) it returns the documented
 * fallback price so the page still renders.
 *
 * IMPORTANT: we construct the Stripe client lazily INSIDE this function rather than
 * importing the module-level singleton from lib/stripe.ts. That module evaluates
 * `new Stripe(process.env.STRIPE_SECRET_KEY!)` at import time, which throws when the
 * secret isn't present (e.g. in the v0 preview) and would crash the whole page.
 */
export async function getLivePrice(): Promise<LivePrice> {
  const fallback: LivePrice = {
    formatted: format(FALLBACK_AMOUNT_MINOR, FALLBACK_CURRENCY),
    interval: FALLBACK_INTERVAL,
    live: false,
  }

  const secret = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID || ''

  try {
    if (!secret || !priceId.startsWith('price_')) {
      return fallback
    }

    // No apiVersion pin here on purpose: let the installed SDK use its default so
    // this file never breaks when the Stripe types bump the pinned version string.
    const stripe = new Stripe(secret, { typescript: true })
    const price = await stripe.prices.retrieve(priceId)

    if (typeof price.unit_amount !== 'number' || !price.currency) {
      return fallback
    }

    return {
      formatted: format(price.unit_amount, price.currency),
      interval: price.recurring?.interval ?? '',
      live: true,
    }
  } catch (err) {
    console.error('[v0] getLivePrice failed, using fallback:', err)
    return fallback
  }
}
