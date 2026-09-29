// Since Stripe API 2025-03-31.basil, `current_period_end` lives on each
// subscription item and `invoice.subscription` moved to
// `invoice.parent.subscription_details.subscription`. Webhook payloads follow
// the endpoint's configured API version, so read both shapes.

type SubscriptionLike = {
  current_period_end?: number | null
  items?: { data?: Array<{ current_period_end?: number | null }> } | null
}

type InvoiceLike = {
  subscription?: string | { id: string } | null
  parent?: {
    subscription_details?: { subscription?: string | { id: string } | null } | null
  } | null
}

export function getSubscriptionPeriodEnd(subscription: unknown): number | null {
  const sub = subscription as SubscriptionLike
  const itemEnds = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((v): v is number => typeof v === 'number')
  if (itemEnds.length > 0) return Math.max(...itemEnds)
  return typeof sub.current_period_end === 'number' ? sub.current_period_end : null
}

export function getSubscriptionPeriodEndDate(subscription: unknown): Date | null {
  const seconds = getSubscriptionPeriodEnd(subscription)
  return seconds === null ? null : new Date(seconds * 1000)
}

export function getInvoiceSubscriptionId(invoice: unknown): string | null {
  const inv = invoice as InvoiceLike
  const ref = inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null
  if (!ref) return null
  return typeof ref === 'string' ? ref : ref.id
}
