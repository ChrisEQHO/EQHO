import { describe, expect, it } from 'vitest'
import {
  checkStorageForDownload,
  isBlockingReason,
  isQuotaError,
  mergeRetriedTracks,
  parsePendingTracks,
  reasonFromStatus,
  sniffAudioHeader,
  validateAudioFile,
} from './cloud-library'

const bytes = (...b: number[]) => new Uint8Array(b)
const text = (s: string) => new TextEncoder().encode(s)

describe('sniffAudioHeader', () => {
  it('accepts common audio formats', () => {
    expect(sniffAudioHeader(bytes(0x49, 0x44, 0x33, 4)).format).toBe('mp3')
    expect(sniffAudioHeader(bytes(0xff, 0xfb, 0x90)).format).toBe('mp3')
    expect(sniffAudioHeader(text('RIFF\0\0\0\0WAVE')).format).toBe('wav')
    expect(sniffAudioHeader(text('\0\0\0 ftypM4A ')).format).toBe('m4a')
    expect(sniffAudioHeader(text('OggS')).format).toBe('ogg')
    expect(sniffAudioHeader(text('fLaC')).format).toBe('flac')
  })

  it('rejects HTML, JSON and empty payloads', () => {
    expect(sniffAudioHeader(text('<!DOCTYPE html>'))).toEqual({ ok: false, problem: 'html' })
    expect(sniffAudioHeader(text('{"error":"x"}'))).toEqual({ ok: false, problem: 'html' })
    expect(sniffAudioHeader(bytes())).toEqual({ ok: false, problem: 'empty' })
    expect(sniffAudioHeader(text('hello world')).ok).toBe(false)
  })
})

describe('validateAudioFile', () => {
  it('flags truncated downloads', async () => {
    const file = new Blob([bytes(0x49, 0x44, 0x33, 1, 2)])
    expect(await validateAudioFile(file, 99)).toEqual({ ok: false, problem: 'size-mismatch' })
    expect((await validateAudioFile(file, 5)).ok).toBe(true)
  })
})

describe('checkStorageForDownload', () => {
  const MB = 1024 * 1024
  it('passes when estimate is unavailable', () => {
    expect(checkStorageForDownload(100 * MB, null).ok).toBe(true)
  })
  it('requires a safety margin', () => {
    expect(checkStorageForDownload(100 * MB, { quota: 115 * MB, usage: 0 }).ok).toBe(false)
    expect(checkStorageForDownload(100 * MB, { quota: 200 * MB, usage: 0 }).ok).toBe(true)
  })
})

describe('failure classification', () => {
  it('maps statuses to reasons', () => {
    expect(reasonFromStatus(401, true)).toBe('auth-expired')
    expect(reasonFromStatus(404, true)).toBe('missing')
    expect(reasonFromStatus(200, false)).toBe('offline')
  })
  it('stops early on blocking reasons only', () => {
    expect(isBlockingReason('auth-expired')).toBe(true)
    expect(isBlockingReason('storage-full')).toBe(true)
    expect(isBlockingReason('missing')).toBe(false)
  })
  it('detects quota errors', () => {
    expect(isQuotaError({ name: 'QuotaExceededError' })).toBe(true)
    expect(isQuotaError(new Error('boom'))).toBe(false)
  })
})

describe('mergeRetriedTracks', () => {
  it('restores original cloud order', () => {
    const merged = mergeRetriedTracks([{ id: 'a' }, { id: 'c' }], [{ id: 'b' }], ['a', 'b', 'c'])
    expect(merged.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('parsePendingTracks', () => {
  it('drops malformed data', () => {
    expect(parsePendingTracks('not json')).toEqual({})
    expect(parsePendingTracks('[]')).toEqual({})
    const parsed = parsePendingTracks(
      JSON.stringify({
        p1: { direction: 'download', cloudId: 'c1', failures: [{ trackId: 't', title: 'T', reason: 'missing' }, null], updatedAt: 'x' },
        p2: { direction: 'sideways', cloudId: 'c', failures: [] },
      }),
    )
    expect(Object.keys(parsed)).toEqual(['p1'])
    expect(parsed.p1.failures).toHaveLength(1)
  })
})
