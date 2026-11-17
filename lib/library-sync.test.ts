import { describe, expect, it } from 'vitest'
import { mergeName, mergeTrackKeys, planLibrarySync, signatureFromKeys } from '@/lib/library-sync'
import type { CloudLinks } from '@/lib/playlist-cloud-links'

const T0 = '2026-11-01T10:00:00.000Z'
const T1 = '2026-11-01T11:00:00.000Z'

const link = (cloudId: string, keys: string[], name = 'Comp', cloudUpdatedAt = T0) => ({
  cloudId,
  cloudUpdatedAt,
  localSignature: signatureFromKeys(keys),
  name,
})

describe('planLibrarySync', () => {
  it('does nothing when both sides match the last sync', () => {
    const links: CloudLinks = { l1: link('c1', ['a', 'b']) }
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a', 'b'] }],
      clouds: [{ id: 'c1', name: 'Comp', updated_at: T0, trackKeys: ['a', 'b'] }],
      links,
      canPush: true,
    })
    expect(actions).toEqual([])
  })

  it('pushes local track, order and name changes', () => {
    const links: CloudLinks = { l1: link('c1', ['a', 'b']), l2: link('c2', ['x'], 'Old') }
    const actions = planLibrarySync({
      locals: [
        { id: 'l1', name: 'Comp', trackKeys: ['b', 'a'] },
        { id: 'l2', name: 'New name', trackKeys: ['x'] },
      ],
      clouds: [
        { id: 'c1', name: 'Comp', updated_at: T0, trackKeys: ['a', 'b'] },
        { id: 'c2', name: 'Old', updated_at: T0, trackKeys: ['x'] },
      ],
      links,
      canPush: true,
    })
    expect(actions).toEqual([
      { type: 'push', localId: 'l1' },
      { type: 'push', localId: 'l2' },
    ])
  })

  it('pulls a cloud update when this device has no changes', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a', 'b'] }],
      clouds: [{ id: 'c1', name: 'Comp', updated_at: T1, trackKeys: ['a'] }],
      links: { l1: link('c1', ['a', 'b']) },
      canPush: true,
    })
    expect(actions).toEqual([{ type: 'pull-replace', cloudId: 'c1', localId: 'l1' }])
  })

  it('merges when both sides changed', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a', 'b', 'c'] }],
      clouds: [{ id: 'c1', name: 'Comp', updated_at: T1, trackKeys: ['a'] }],
      links: { l1: link('c1', ['a', 'b']) },
      canPush: true,
    })
    expect(actions).toEqual([{ type: 'merge', cloudId: 'c1', localId: 'l1', baselineKeys: ['a', 'b'] }])
  })

  it('removes a playlist deleted on another device, even with local edits', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a', 'b', 'z'] }],
      clouds: [],
      links: { l1: link('c1', ['a', 'b']) },
      canPush: true,
    })
    expect(actions).toEqual([{ type: 'remove-local', localId: 'l1' }])
  })

  it('deletes from the cloud a playlist deleted on this device and does not pull it back', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l2', name: 'Other', trackKeys: ['x'] }],
      clouds: [
        { id: 'c1', name: 'Comp', updated_at: T0, trackKeys: ['a'] },
        { id: 'c2', name: 'Other', updated_at: T0, trackKeys: ['x'] },
      ],
      links: { l1: link('c1', ['a']), l2: link('c2', ['x'], 'Other') },
      canPush: true,
    })
    expect(actions).toEqual([{ type: 'delete-cloud', localId: 'l1', cloudId: 'c1' }])
  })

  it('treats every linked playlist disappearing at once as a storage reset, not a delete', () => {
    const actions = planLibrarySync({
      locals: [],
      clouds: [
        { id: 'c1', name: 'A', updated_at: T0, trackKeys: ['a'] },
        { id: 'c2', name: 'B', updated_at: T0, trackKeys: ['b'] },
      ],
      links: { l1: link('c1', ['a'], 'A'), l2: link('c2', ['b'], 'B') },
      canPush: true,
    })
    expect(actions.filter((a) => a.type === 'delete-cloud')).toEqual([])
    expect(actions.filter((a) => a.type === 'pull-new').map((a) => 'cloudId' in a && a.cloudId)).toEqual(['c1', 'c2'])
  })

  it('pushes a new local playlist and pulls a new cloud playlist', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l9', name: 'Fresh', trackKeys: ['q'] }],
      clouds: [{ id: 'c5', name: 'From iPad', updated_at: T0, trackKeys: ['r'] }],
      links: {},
      canPush: true,
    })
    expect(actions).toEqual([
      { type: 'push', localId: 'l9' },
      { type: 'pull-new', cloudId: 'c5' },
    ])
  })

  it('adopts an unlinked cloud copy with the same name instead of duplicating it', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a'] }],
      clouds: [{ id: 'c1', name: 'Comp', updated_at: T0, trackKeys: ['a', 'b'] }],
      links: {},
      canPush: true,
    })
    expect(actions).toEqual([{ type: 'merge', cloudId: 'c1', localId: 'l1', baselineKeys: [] }])
  })

  it('never pushes or deletes from a read-only device', () => {
    const actions = planLibrarySync({
      locals: [{ id: 'l1', name: 'Comp', trackKeys: ['a', 'b', 'c'] }],
      clouds: [
        { id: 'c1', name: 'Comp', updated_at: T0, trackKeys: ['a', 'b'] },
        { id: 'c2', name: 'Gone here', updated_at: T0, trackKeys: ['x'] },
      ],
      links: { l1: link('c1', ['a', 'b']), l2: link('c2', ['x'], 'Gone here') },
      canPush: false,
    })
    expect(actions).toEqual([{ type: 'drop-link', localId: 'l2' }])
  })
})

describe('mergeTrackKeys', () => {
  it('keeps removals from either side and additions from both', () => {
    // Baseline a,b,c. Elsewhere: removed b, added d. Here: removed c, added e.
    expect(mergeTrackKeys(['a', 'b', 'c'], ['a', 'b', 'e'], ['a', 'c', 'd'])).toEqual(['a', 'd', 'e'])
  })

  it('does not restore a track deleted elsewhere', () => {
    expect(mergeTrackKeys(['a', 'b'], ['a', 'b', 'n'], ['a'])).toEqual(['a', 'n'])
  })

  it('unions both lists when there is no baseline', () => {
    expect(mergeTrackKeys([], ['a', 'x'], ['a', 'b'])).toEqual(['a', 'b', 'x'])
  })
})

describe('mergeName', () => {
  it('prefers a local rename, otherwise the cloud name', () => {
    expect(mergeName('Renamed', 'Comp', 'Comp')).toBe('Renamed')
    expect(mergeName('Comp', 'Cloud rename', 'Comp')).toBe('Cloud rename')
    expect(mergeName('Comp', 'Cloud', undefined)).toBe('Cloud')
  })
})
