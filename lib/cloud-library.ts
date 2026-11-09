// Pure rules behind the Cloud Library: one status per playlist, audio
// validation before anything is called "Offline ready", storage checks, and
// classification of transfer failures. Kept free of React/Supabase so every
// rule is unit tested.

export type LibraryStatus =
  | 'cloud-only'
  | 'on-device'
  | 'cloud-and-device'
  | 'offline-ready'
  | 'downloading'
  | 'uploading'
  | 'update-available'
  | 'needs-attention'

export const LIBRARY_STATUS_LABEL: Record<LibraryStatus, string> = {
  'cloud-only': 'Cloud only',
  'on-device': 'On this device',
  'cloud-and-device': 'Cloud and device',
  'offline-ready': 'Offline ready',
  downloading: 'Downloading',
  uploading: 'Uploading',
  'update-available': 'Update available',
  'needs-attention': 'Needs attention',
}

export type TransferFailureReason =
  | 'auth-expired'
  | 'offline'
  | 'storage-full'
  | 'missing'
  | 'access-denied'
  | 'invalid-audio'
  | 'not-configured'
  | 'unknown'

export interface TrackFailure {
  trackId: string
  title: string
  reason: TransferFailureReason
}

export type AttentionReason = 'failed-tracks' | 'conflict' | 'transfer-failed' | 'storage-full' | 'auth-expired'

export interface LibraryStatusInput {
  transfer?: 'uploading' | 'downloading'
  hasLocal: boolean
  hasCloud: boolean
  // Every local track has stored audio that passed validation.
  localAudioComplete: boolean
  failedTrackCount: number
  transferFailed: boolean
  cloudChanged: boolean
  localChanged: boolean
}

export interface LibraryStatusResult {
  status: LibraryStatus
  attention: AttentionReason | null
}

// Order matters: an in-flight transfer is always shown, then anything the user
// must act on, then the steady states.
export function deriveLibraryStatus(input: LibraryStatusInput): LibraryStatusResult {
  if (input.transfer === 'uploading') return { status: 'uploading', attention: null }
  if (input.transfer === 'downloading') return { status: 'downloading', attention: null }
  if (input.transferFailed) return { status: 'needs-attention', attention: 'transfer-failed' }
  if (input.failedTrackCount > 0) return { status: 'needs-attention', attention: 'failed-tracks' }
  if (!input.hasLocal) return { status: input.hasCloud ? 'cloud-only' : 'on-device', attention: null }
  if (!input.hasCloud) return { status: 'on-device', attention: null }
  if (input.cloudChanged && input.localChanged) return { status: 'needs-attention', attention: 'conflict' }
  if (input.cloudChanged) return { status: 'update-available', attention: null }
  if (input.localChanged) return { status: 'cloud-and-device', attention: null }
  return { status: input.localAudioComplete ? 'offline-ready' : 'cloud-and-device', attention: null }
}

export type LibraryAction =
  | 'upload'
  | 'download'
  | 'open'
  | 'update-local'
  | 'update-cloud'
  | 'remove-local'
  | 'retry-failed'
  | 'review-conflict'

// Actions offered for a status. "open" requires playable local audio.
export function actionsForStatus(
  result: LibraryStatusResult,
  ctx: { hasLocal: boolean; hasCloud: boolean; playable: boolean; failedTransferDirection?: 'upload' | 'download' },
): LibraryAction[] {
  const open: LibraryAction[] = ctx.playable ? ['open'] : []
  const removeLocal: LibraryAction[] = ctx.hasLocal ? ['remove-local'] : []
  switch (result.status) {
    case 'uploading':
    case 'downloading':
      return open
    case 'cloud-only':
      return ['download']
    case 'on-device':
      return [...open, 'upload', ...removeLocal]
    case 'update-available':
      return ['update-local', ...open, ...removeLocal]
    case 'cloud-and-device':
      return [...open, 'update-cloud', ...removeLocal]
    case 'offline-ready':
      return [...open, ...removeLocal]
    case 'needs-attention':
      if (result.attention === 'conflict') return ['review-conflict', ...open, ...removeLocal]
      if (result.attention === 'failed-tracks') return ['retry-failed', ...open, ...removeLocal]
      if (ctx.failedTransferDirection === 'upload') return ['retry-failed', ...open, ...removeLocal]
      return [ctx.hasCloud && !ctx.hasLocal ? 'download' : 'retry-failed', ...open, ...removeLocal]
  }
}

// ---------- Audio validation ----------

export interface AudioValidation {
  ok: boolean
  format?: 'mp3' | 'wav' | 'm4a' | 'ogg' | 'flac' | 'aac' | 'webm'
  problem?: 'empty' | 'html' | 'unrecognised' | 'size-mismatch'
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0) {
  if (bytes.length < offset + sig.length) return false
  return sig.every((b, i) => bytes[offset + i] === b)
}

export function sniffAudioHeader(bytes: Uint8Array): AudioValidation {
  if (bytes.length === 0) return { ok: false, problem: 'empty' }
  const ascii = String.fromCharCode(...bytes.slice(0, 16)).toLowerCase().trimStart()
  if (ascii.startsWith('<!doctype') || ascii.startsWith('<html') || ascii.startsWith('<?xml') || ascii.startsWith('{')) {
    return { ok: false, problem: 'html' }
  }
  if (startsWith(bytes, [0x49, 0x44, 0x33])) return { ok: true, format: 'mp3' } // ID3
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x41, 0x56, 0x45], 8)) {
    return { ok: true, format: 'wav' }
  }
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return { ok: true, format: 'm4a' } // ....ftyp
  if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) return { ok: true, format: 'ogg' }
  if (startsWith(bytes, [0x66, 0x4c, 0x61, 0x43])) return { ok: true, format: 'flac' }
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return { ok: true, format: 'webm' }
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0) return { ok: true, format: 'aac' } // ADTS
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return { ok: true, format: 'mp3' } // MPEG frame sync
  return { ok: false, problem: 'unrecognised' }
}

// Validates a downloaded file before it may be counted as offline ready.
// When the cloud recorded a size, a mismatch means a truncated transfer.
export async function validateAudioFile(
  file: Blob,
  expectedSize?: number | null,
): Promise<AudioValidation> {
  if (!file || file.size === 0) return { ok: false, problem: 'empty' }
  if (expectedSize && expectedSize > 0 && file.size !== expectedSize) {
    return { ok: false, problem: 'size-mismatch' }
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  return sniffAudioHeader(head)
}

// ---------- Storage ----------

// Downloads keep a 10% (min 20 MB) margin so IndexedDB writes don't fail midway.
export function checkStorageForDownload(
  requiredBytes: number,
  estimate: { quota?: number; usage?: number } | null,
): { ok: true } | { ok: false; requiredBytes: number; availableBytes: number } {
  if (!estimate || !estimate.quota || requiredBytes <= 0) return { ok: true }
  const available = Math.max(0, estimate.quota - (estimate.usage ?? 0))
  const needed = requiredBytes + Math.max(requiredBytes * 0.1, 20 * 1024 * 1024)
  return available >= needed ? { ok: true } : { ok: false, requiredBytes: Math.round(needed), availableBytes: available }
}

export async function estimateDeviceStorage(): Promise<{ quota?: number; usage?: number } | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
    return await navigator.storage.estimate()
  } catch {
    return null
  }
}

export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; code?: number; message?: string }
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    /quota|storage.*full|not enough space/i.test(e.message || '')
  )
}

// ---------- Failure classification ----------

export function reasonFromStatus(status: number, online: boolean): TransferFailureReason {
  if (!online || status === 0) return 'offline'
  if (status === 401) return 'auth-expired'
  if (status === 403) return 'access-denied'
  if (status === 404) return 'missing'
  if (status === 500 || status === 503) return 'not-configured'
  return 'unknown'
}

// Reasons that will fail every remaining track too, so the transfer stops
// early and the rest are marked pending instead of hammering the network.
export function isBlockingReason(reason: TransferFailureReason): boolean {
  return reason === 'auth-expired' || reason === 'offline' || reason === 'storage-full'
}

export function describeFailureReason(reason: TransferFailureReason): string {
  switch (reason) {
    case 'auth-expired':
      return 'Your sign-in expired. Sign in again, then retry.'
    case 'offline':
      return 'The connection was interrupted. Reconnect, then retry.'
    case 'storage-full':
      return 'This device is out of storage. Free up space, then retry.'
    case 'missing':
      return 'The audio file is missing from EQHO Cloud. Upload it again from the device that has it.'
    case 'access-denied':
      return "This audio belongs to a different account and can't be downloaded."
    case 'invalid-audio':
      return "The downloaded file wasn't valid audio."
    case 'not-configured':
      return 'EQHO Cloud is temporarily unavailable. Try again shortly.'
    default:
      return "This track couldn't be transferred."
  }
}

// ---------- Retry merging ----------

// Places retried tracks back into their original positions using the cloud
// order, so a retry never reshuffles the playlist.
export function mergeRetriedTracks<T extends { id: string }>(
  existing: T[],
  retried: T[],
  order: string[],
): T[] {
  const byId = new Map<string, T>()
  for (const t of existing) byId.set(t.id, t)
  for (const t of retried) byId.set(t.id, t)
  const ordered: T[] = []
  const used = new Set<string>()
  for (const id of order) {
    const t = byId.get(id)
    if (t && !used.has(id)) {
      ordered.push(t)
      used.add(id)
    }
  }
  for (const t of byId.values()) if (!used.has(t.id)) ordered.push(t)
  return ordered
}

// Pending (failed) track metadata stored per local playlist so the playlist,
// its order and its missing tracks survive reloads and offline use.
export interface PendingTracksRecord {
  direction: 'upload' | 'download'
  cloudId: string
  failures: TrackFailure[]
  updatedAt: string
}

export type PendingTracks = Record<string, PendingTracksRecord>

export const PENDING_TRACKS_STORAGE_KEY = 'eqho-cloud-pending-tracks'

export function parsePendingTracks(raw: string | null): PendingTracks {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: PendingTracks = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const v = value as Partial<PendingTracksRecord> | null
      if (
        v &&
        (v.direction === 'upload' || v.direction === 'download') &&
        typeof v.cloudId === 'string' &&
        Array.isArray(v.failures)
      ) {
        const failures = v.failures.filter(
          (f): f is TrackFailure =>
            !!f && typeof (f as TrackFailure).trackId === 'string' && typeof (f as TrackFailure).title === 'string',
        )
        if (failures.length > 0) {
          out[key] = { direction: v.direction, cloudId: v.cloudId, failures, updatedAt: String(v.updatedAt ?? '') }
        }
      }
    }
    return out
  } catch {
    return {}
  }
}
