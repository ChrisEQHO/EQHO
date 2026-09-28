import { describe, expect, it } from 'vitest'
import {
  deriveCloudDeviceStatus,
  deriveLocalCloudStatus,
  formatBytes,
  isNewerTimestamp,
  parseCloudLinks,
  resolveCloudForLocal,
  resolveLocalForCloud,
  type CloudLinks,
} from './playlist-cloud-links'

const T1 = '2026-09-01T10:00:00.000Z'
const T2 = '2026-09-02T10:00:00.000Z'
const T3 = '2026-09-03T10:00:00.000Z'

describe('deriveLocalCloudStatus', () => {
  const base = { cloudMatched: true, localSignature: 'a|b', fallbackInSync: false }

  it('reports not uploaded when there is no cloud copy', () => {
    expect(deriveLocalCloudStatus({ ...base, cloudMatched: false })).toBe('not-uploaded')
  })
  it('upload progress and failure take priority', () => {
    expect(deriveLocalCloudStatus({ ...base, uploadState: 'uploading' })).toBe('uploading')
    expect(deriveLocalCloudStatus({ ...base, uploadState: 'failed' })).toBe('upload-failed')
  })
  it('is synced when the local signature matches the last sync', () => {
    const link = { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: 'a|b' }
    expect(deriveLocalCloudStatus({ ...base, link })).toBe('synced')
  })
  it('reports updates available after a local change', () => {
    const link = { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: 'a' }
    expect(deriveLocalCloudStatus({ ...base, link })).toBe('updates-available')
  })
  it('falls back to track comparison for legacy unlinked playlists', () => {
    expect(deriveLocalCloudStatus({ ...base, fallbackInSync: true })).toBe('synced')
    expect(deriveLocalCloudStatus({ ...base, fallbackInSync: false })).toBe('updates-available')
  })
})

describe('deriveCloudDeviceStatus', () => {
  const link = { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: 'a|b' }

  it('is not downloaded without a local copy', () => {
    expect(deriveCloudDeviceStatus({ cloudUpdatedAt: T1 }).status).toBe('not-downloaded')
  })
  it('never reports a failed or in-progress download as downloaded', () => {
    const localCopy = { signature: 'a|b' }
    expect(deriveCloudDeviceStatus({ downloadState: 'failed', localCopy, link, cloudUpdatedAt: T1 }).status).toBe('download-failed')
    expect(deriveCloudDeviceStatus({ downloadState: 'downloading', localCopy, link, cloudUpdatedAt: T1 }).status).toBe('downloading')
  })
  it('is downloaded when the cloud version is unchanged', () => {
    expect(deriveCloudDeviceStatus({ localCopy: { signature: 'x' }, link, cloudUpdatedAt: T1 })).toEqual({ status: 'downloaded', conflict: null })
  })
  it('offers an update when only the cloud changed', () => {
    expect(deriveCloudDeviceStatus({ localCopy: { signature: 'a|b' }, link, cloudUpdatedAt: T2 })).toEqual({
      status: 'update-available',
      conflict: 'cloud-newer',
    })
  })
  it('flags a conflict when both copies changed', () => {
    expect(deriveCloudDeviceStatus({ localCopy: { signature: 'a|b|c' }, link, cloudUpdatedAt: T2 }).conflict).toBe('both-changed')
  })
  it('respects "Keep current version" until the cloud changes again', () => {
    const dismissed = { ...link, dismissedCloudUpdatedAt: T2 }
    expect(deriveCloudDeviceStatus({ localCopy: { signature: 'a|b' }, link: dismissed, cloudUpdatedAt: T2 }).status).toBe('downloaded')
    expect(deriveCloudDeviceStatus({ localCopy: { signature: 'a|b' }, link: dismissed, cloudUpdatedAt: T3 }).status).toBe('update-available')
  })
})

describe('matching local and cloud playlists', () => {
  const clouds = [
    { id: 'c1', name: 'Floor' },
    { id: 'c2', name: 'Beam' },
  ]

  it('prefers the persistent link over the name, surviving a rename', () => {
    const links: CloudLinks = { local1: { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: '' } }
    const locals = [{ id: 'local1', name: 'Floor (renamed)' }]
    expect(resolveCloudForLocal(locals[0], clouds, links)?.id).toBe('c1')
    expect(resolveLocalForCloud(clouds[0], locals, links)?.id).toBe('local1')
  })
  it('does not fall back to a cloud playlist already linked to another local', () => {
    const links: CloudLinks = { local1: { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: '' } }
    expect(resolveCloudForLocal({ id: 'local2', name: 'Floor' }, clouds, links)).toBeUndefined()
  })
  it('matches legacy playlists by id then name', () => {
    expect(resolveCloudForLocal({ id: 'c2', name: 'x' }, clouds, {})?.id).toBe('c2')
    expect(resolveCloudForLocal({ id: 'zz', name: 'Beam' }, clouds, {})?.id).toBe('c2')
  })
})

describe('helpers', () => {
  it('compares timestamps safely', () => {
    expect(isNewerTimestamp(T2, T1)).toBe(true)
    expect(isNewerTimestamp(T1, T2)).toBe(false)
    expect(isNewerTimestamp('bad', T1)).toBe(false)
    expect(isNewerTimestamp(T2, undefined)).toBe(false)
  })
  it('parses stored links and drops malformed entries', () => {
    const raw = JSON.stringify({
      ok: { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: 's' },
      bad: { cloudId: 3 },
    })
    expect(parseCloudLinks(raw)).toEqual({ ok: { cloudId: 'c1', cloudUpdatedAt: T1, localSignature: 's' } })
    expect(parseCloudLinks('not json')).toEqual({})
    expect(parseCloudLinks(null)).toEqual({})
  })
  it('formats download sizes', () => {
    expect(formatBytes(undefined)).toBeNull()
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatBytes(2048)).toBe('2 KB')
  })
})
