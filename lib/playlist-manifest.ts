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

// The saved track_order is the authoritative manifest of a cloud playlist. Rows
// for tracks removed in a later upload used to linger in the `tracks` table and
// were appended on download — inflating the track count and, when their audio
// was gone, failing the whole download on another device. Only legacy playlists
// with no saved order fall back to every row.
export function selectManifestTracks<T extends { id: string }>(order: unknown, rows: T[]): T[] {
  const ids = Array.isArray(order) ? order.filter((v): v is string => typeof v === 'string') : []
  if (ids.length === 0) return rows
  const byId = new Map(rows.map((r) => [r.id.toLowerCase(), r]))
  const out: T[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const key = id.toLowerCase()
    const row = byId.get(key)
    if (row && !seen.has(key)) {
      seen.add(key)
      out.push(row)
    }
  }
  return out
}

// Rows belonging to a playlist that are not part of its manifest (safe to clean up).
export function findOrphanTracks<T extends { id: string }>(order: string[], rows: T[]): T[] {
  const keep = new Set(order.map((id) => id.toLowerCase()))
  return rows.filter((r) => !keep.has(r.id.toLowerCase()))
}

// Recover the real R2 object for a track whose recorded storage_path doesn't
// resolve. Older uploads recorded the path from the track's display fileName while
// the object was stored under the File's actual name, so match progressively looser.
export function matchR2ObjectForTrack(
  track: { id: string; title: string; storage_path?: string | null },
  listing: Array<{ key: string; fileName: string }>,
  claimedKeys: Set<string> = new Set(),
): { key: string; fileName: string } | undefined {
  const available = listing.filter((o) => !claimedKeys.has(o.key))
  const norm = (s: string) => s.toLowerCase().replace(/\.[a-z0-9]{2,5}$/, '').replace(/[^a-z0-9]+/g, '')
  const path = track.storage_path || ''
  const dbFileName = path.split('/').pop() || ''
  const trackFolder = path.split('/').slice(0, -1).join('/')
  return (
    (path ? available.find((o) => o.key === path) : undefined) ||
    available.find((o) => o.key.includes(`/tracks/${track.id}/`)) ||
    (trackFolder ? available.find((o) => o.key.startsWith(`${trackFolder}/`)) : undefined) ||
    (dbFileName ? available.find((o) => o.fileName.toLowerCase() === dbFileName.toLowerCase()) : undefined) ||
    (dbFileName ? available.find((o) => norm(o.fileName) === norm(dbFileName)) : undefined) ||
    (track.title ? available.find((o) => norm(o.fileName) === norm(track.title)) : undefined)
  )
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
