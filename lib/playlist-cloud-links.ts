// Persistent link between a playlist stored on this device and its EQHO Cloud
// copy. Cloud playlist ids are server UUIDs that usually differ from local ids,
// so without this link the only way to pair them was by name — which broke on
// rename and let "Upload changes" create duplicates. The link also records the
// cloud version (updated_at) and the local track signature at the last
// successful sync, which is what lets us tell "changed here" apart from
// "changed in the cloud" and detect true conflicts.

export interface CloudLink {
  cloudId: string
  cloudUpdatedAt: string
  localSignature: string
  // Set when the user chose "Keep current version" for this cloud version, so
  // the same update isn't offered again until the cloud changes once more.
  dismissedCloudUpdatedAt?: string
}

export type CloudLinks = Record<string, CloudLink>

export const CLOUD_LINKS_STORAGE_KEY = 'eqho-cloud-links'

export function parseCloudLinks(raw: string | null): CloudLinks {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const links: CloudLinks = {}
    for (const [localId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const v = value as Partial<CloudLink> | null
      if (v && typeof v.cloudId === 'string' && typeof v.cloudUpdatedAt === 'string' && typeof v.localSignature === 'string') {
        links[localId] = {
          cloudId: v.cloudId,
          cloudUpdatedAt: v.cloudUpdatedAt,
          localSignature: v.localSignature,
          ...(typeof v.dismissedCloudUpdatedAt === 'string' ? { dismissedCloudUpdatedAt: v.dismissedCloudUpdatedAt } : {}),
        }
      }
    }
    return links
  } catch {
    return {}
  }
}

export function isNewerTimestamp(candidate?: string, baseline?: string): boolean {
  if (!candidate) return false
  if (!baseline) return false
  const a = Date.parse(candidate)
  const b = Date.parse(baseline)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return a > b
}

export type LocalCloudStatus = 'not-uploaded' | 'uploading' | 'synced' | 'updates-available' | 'upload-failed'

export function deriveLocalCloudStatus(input: {
  uploadState?: 'uploading' | 'failed'
  cloudMatched: boolean
  link?: CloudLink
  localSignature: string
  // Track-by-track comparison against the cloud copy, used only for legacy
  // playlists uploaded before links existed.
  fallbackInSync: boolean
}): LocalCloudStatus {
  if (input.uploadState === 'uploading') return 'uploading'
  if (input.uploadState === 'failed') return 'upload-failed'
  if (!input.cloudMatched) return 'not-uploaded'
  if (input.link) {
    return input.link.localSignature === input.localSignature ? 'synced' : 'updates-available'
  }
  return input.fallbackInSync ? 'synced' : 'updates-available'
}

export type CloudDeviceStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'update-available' | 'download-failed'
export type CloudConflictKind = 'cloud-newer' | 'both-changed'

export function deriveCloudDeviceStatus(input: {
  downloadState?: 'downloading' | 'failed'
  localCopy?: { signature: string }
  link?: CloudLink
  cloudUpdatedAt: string
}): { status: CloudDeviceStatus; conflict: CloudConflictKind | null } {
  if (input.downloadState === 'downloading') return { status: 'downloading', conflict: null }
  if (input.downloadState === 'failed') return { status: 'download-failed', conflict: null }
  if (!input.localCopy) return { status: 'not-downloaded', conflict: null }

  const link = input.link
  if (!link) return { status: 'downloaded', conflict: null }

  const cloudNewer = isNewerTimestamp(input.cloudUpdatedAt, link.cloudUpdatedAt)
  const dismissed =
    !!link.dismissedCloudUpdatedAt && !isNewerTimestamp(input.cloudUpdatedAt, link.dismissedCloudUpdatedAt)
  if (!cloudNewer || dismissed) return { status: 'downloaded', conflict: null }

  const localChanged = link.localSignature !== input.localCopy.signature
  return { status: 'update-available', conflict: localChanged ? 'both-changed' : 'cloud-newer' }
}

// Find the local playlist that corresponds to a cloud playlist. A persistent
// link always wins; legacy id/name matching is only used when no local playlist
// is linked to this cloud id and the candidate isn't linked elsewhere.
export function resolveLocalForCloud<T extends { id: string; name: string }>(
  cloud: { id: string; name: string },
  locals: T[],
  links: CloudLinks,
): T | undefined {
  const linked = locals.find((l) => links[l.id]?.cloudId === cloud.id)
  if (linked) return linked
  const unlinked = locals.filter((l) => !links[l.id])
  return unlinked.find((l) => l.id === cloud.id) || unlinked.find((l) => l.name === cloud.name)
}

// Inverse of resolveLocalForCloud: the cloud playlist for a local playlist.
export function resolveCloudForLocal<C extends { id: string; name: string }>(
  local: { id: string; name: string },
  clouds: C[],
  links: CloudLinks,
): C | undefined {
  const link = links[local.id]
  if (link) return clouds.find((c) => c.id === link.cloudId)
  const claimed = new Set(Object.values(links).map((l) => l.cloudId))
  const available = clouds.filter((c) => !claimed.has(c.id))
  return available.find((c) => c.id === local.id) || available.find((c) => c.name === local.name)
}

export function formatBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  if (mb >= 1) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
