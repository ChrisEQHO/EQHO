const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value)

// `playlists.track_order` is a Postgres UUID[] column: a single non-UUID or empty
// element makes Postgres reject the whole UPDATE (22P02), and a duplicate id makes
// the same track appear twice after download. Keep the first occurrence of each
// valid id, in order.
export function sanitizeTrackOrder(order: unknown): string[] {
  if (!Array.isArray(order)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of order) {
    if (!isUuid(value)) continue
    const id = value.toLowerCase()
    if (seen.has(id)) continue
    seen.add(id)
    out.push(value)
  }
  return out
}

export type ManifestStage = 'auth' | 'entitlement' | 'request' | 'lookup' | 'ownership' | 'update' | 'network'

export interface ManifestSaveResult {
  success: boolean
  status?: number
  stage?: ManifestStage
  code?: string
}

// Customer-facing text for a failed manifest save. Includes only the safe stage
// and Postgres/HTTP code (never tokens, keys or row data) so support can tell
// which step failed.
export function describeManifestError(result: ManifestSaveResult): string {
  if (result.stage === 'auth' || result.status === 401) {
    return 'Your session has expired. Please sign in again, then press Try again.'
  }
  if (result.stage === 'entitlement' || result.status === 402) {
    return 'An active EQHO subscription is required to save playlists to EQHO Cloud.'
  }
  const ref = [result.stage, result.code ?? (result.status ? String(result.status) : undefined)]
    .filter(Boolean)
    .join(':')
  return `The playlist order could not be saved to EQHO Cloud${ref ? ` (${ref})` : ''}. Please try again.`
}
