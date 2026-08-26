// Small pure formatters shared by store UI. Safe for both server and client.

/** Format a smallest-unit price (e.g. 499 pence) as a currency string ("£4.99"). */
export function formatPrice(cents: number | null | undefined, currency = 'gbp'): string {
  if (cents == null) return ''
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    // Fallback if the currency code is somehow invalid.
    return `£${(cents / 100).toFixed(2)}`
  }
}

/** Format a duration in seconds as m:ss (e.g. 90 -> "1:30"). */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}
