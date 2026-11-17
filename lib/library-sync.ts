// Automatic library sync planner. Pure: given this device's library, the cloud
// library and the persisted links (local id -> cloud id + the last synced
// version), it decides what to push, pull, merge or delete.
//
// The link records the cloud version and the track list at the last successful
// sync. That baseline is what lets every case be decided without a server-side
// change log, and it lives in localStorage so pending work survives restarts:
// - local differs from baseline          -> changed here, push it
// - cloud updated_at newer than baseline -> changed elsewhere, pull it
// - both                                 -> three-way merge, then push
// - linked but gone from the cloud       -> deleted elsewhere; delete wins, so a
//                                           stale device never brings it back
// - linked but gone from this device     -> deleted here, delete from the cloud

import { isNewerTimestamp, type CloudLinks } from '@/lib/playlist-cloud-links'

export interface SyncLocalPlaylist {
  id: string
  name: string
  trackKeys: string[]
}

export interface SyncCloudPlaylist {
  id: string
  name: string
  updated_at: string
  trackKeys: string[]
}

export type SyncAction =
  | { type: 'push'; localId: string }
  | { type: 'pull-new'; cloudId: string }
  | { type: 'pull-replace'; cloudId: string; localId: string }
  | { type: 'merge'; cloudId: string; localId: string; baselineKeys: string[] }
  | { type: 'remove-local'; localId: string }
  | { type: 'delete-cloud'; localId: string; cloudId: string }
  | { type: 'drop-link'; localId: string }

export const signatureFromKeys = (keys: string[]): string => keys.join('|')
export const keysFromSignature = (signature: string): string[] => (signature ? signature.split('|') : [])

export function isLocallyChanged(local: SyncLocalPlaylist, link: CloudLinks[string]): boolean {
  if (signatureFromKeys(local.trackKeys) !== link.localSignature) return true
  return link.name !== undefined && link.name !== local.name
}

export function planLibrarySync(input: {
  locals: SyncLocalPlaylist[]
  clouds: SyncCloudPlaylist[]
  links: CloudLinks
  canPush: boolean
}): SyncAction[] {
  const { locals, clouds, links, canPush } = input
  const actions: SyncAction[] = []
  const cloudById = new Map(clouds.map((c) => [c.id, c]))
  const localIds = new Set(locals.map((l) => l.id))
  const handledClouds = new Set<string>()

  // Links whose local playlist is gone. If every linked playlist vanished at
  // once the device's storage was most likely cleared, so re-download instead
  // of wiping the account's cloud library.
  const orphanedLinks = Object.entries(links).filter(([localId]) => !localIds.has(localId))
  const storageReset = orphanedLinks.length >= 2 && orphanedLinks.length === Object.keys(links).length
  for (const [localId, link] of orphanedLinks) {
    handledClouds.add(link.cloudId)
    if (storageReset || !cloudById.has(link.cloudId) || !canPush) {
      actions.push({ type: 'drop-link', localId })
      if (storageReset) handledClouds.delete(link.cloudId)
    } else {
      actions.push({ type: 'delete-cloud', localId, cloudId: link.cloudId })
    }
  }

  const claimedByLink = new Set(Object.values(links).map((l) => l.cloudId))

  for (const local of locals) {
    const link = links[local.id]
    if (link) {
      handledClouds.add(link.cloudId)
      const cloud = cloudById.get(link.cloudId)
      if (!cloud) {
        actions.push({ type: 'remove-local', localId: local.id })
        continue
      }
      const changedHere = isLocallyChanged(local, link)
      const changedThere = isNewerTimestamp(cloud.updated_at, link.cloudUpdatedAt)
      if (changedHere && changedThere && canPush) {
        actions.push({ type: 'merge', cloudId: cloud.id, localId: local.id, baselineKeys: keysFromSignature(link.localSignature) })
      } else if (changedThere) {
        actions.push({ type: 'pull-replace', cloudId: cloud.id, localId: local.id })
      } else if (changedHere && canPush) {
        actions.push({ type: 'push', localId: local.id })
      }
      continue
    }

    // Never synced from this device. A legacy cloud copy with the same id or
    // name is adopted with an empty baseline, so both sides' tracks are kept.
    const legacy =
      clouds.find((c) => !claimedByLink.has(c.id) && !handledClouds.has(c.id) && c.id === local.id) ||
      clouds.find((c) => !claimedByLink.has(c.id) && !handledClouds.has(c.id) && c.name === local.name)
    if (legacy) {
      handledClouds.add(legacy.id)
      actions.push({ type: 'merge', cloudId: legacy.id, localId: local.id, baselineKeys: [] })
    } else if (canPush) {
      actions.push({ type: 'push', localId: local.id })
    }
  }

  for (const cloud of clouds) {
    if (!handledClouds.has(cloud.id) && !claimedByLink.has(cloud.id)) {
      actions.push({ type: 'pull-new', cloudId: cloud.id })
    }
  }
  for (const [, link] of orphanedLinks) {
    if (storageReset && cloudById.has(link.cloudId)) actions.push({ type: 'pull-new', cloudId: link.cloudId })
  }

  return actions
}

// Three-way merge of track lists. Starts from the cloud order, drops tracks this
// device removed since the baseline, and appends tracks this device added.
// Tracks removed elsewhere stay removed because they're absent from the cloud.
export function mergeTrackKeys(baseline: string[], local: string[], cloud: string[]): string[] {
  const base = new Set(baseline)
  const localSet = new Set(local)
  const cloudSet = new Set(cloud)
  const removedHere = new Set(baseline.filter((k) => !localSet.has(k)))
  const merged = cloud.filter((k) => !removedHere.has(k))
  const seen = new Set(merged)
  for (const k of local) {
    if (!base.has(k) && !cloudSet.has(k) && !seen.has(k)) {
      merged.push(k)
      seen.add(k)
    }
  }
  return merged
}

// Name for a merged playlist: a rename on this device wins over the cloud name.
export function mergeName(localName: string, cloudName: string, baselineName?: string): string {
  if (baselineName !== undefined && localName !== baselineName) return localName
  return cloudName
}
