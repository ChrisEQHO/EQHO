import 'server-only'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

/**
 * Server-only storage layer for the PUBLIC interactive demo (Phase Two).
 *
 * The demo is a FIXED SNAPSHOT that lives entirely under the `demo/` key prefix
 * in the same R2 bucket, completely separate from customer data under
 * `users/{userId}/`. It has its own manifest and its own copied audio files.
 *
 * Isolation guarantees enforced here:
 *  - Public reads only ever touch the `demo/` prefix (never `users/...`).
 *  - There is NO fallback to private source files — a missing demo object is a
 *    missing demo object, full stop.
 *  - Uses the same Vercel-provided R2 credentials as the production route but is
 *    server-only; credentials never reach the client bundle.
 *  - Publishing COPIES bytes into `demo/`; it never moves, renames or deletes the
 *    admin's original `users/{adminId}/...` objects.
 *
 * No Supabase table and no migration are used: the snapshot + the public/disabled
 * state are represented by `demo/manifest.json`.
 */

const DEMO_PREFIX = 'demo/'
const MANIFEST_KEY = 'demo/manifest.json'

/** Snapshot size limits (relaxed from the original fixed 2×5). */
export const MAX_PLAYLISTS = 3
export const MAX_TRACKS_PER_PLAYLIST = 10

// ---------------------------------------------------------------------------
// Public manifest types. Everything here is safe to expose to anonymous
// visitors: display names, ordering, durations, and demo-relative audio keys.
// NEVER add user ids, emails, tokens, Supabase ids, private storage paths,
// signed URLs, Stripe data, credentials or device paths to this shape.
// ---------------------------------------------------------------------------
export interface DemoTrack {
  /** Stable id within the demo (e.g. "p1-t3"). Not a Supabase id. */
  id: string
  /** Public display name (admin-edited; may differ from the original file). */
  name: string
  /** Track duration in seconds. */
  durationSeconds: number
  /** Demo-relative audio object key under the demo/ prefix. */
  audioKey: string
}

export interface DemoPlaylist {
  /** Stable id within the demo (e.g. "p1"). Not a Supabase id. */
  id: string
  /** Public display name (admin-edited). */
  name: string
  /** Tracks in published order. */
  tracks: DemoTrack[]
}

export interface DemoManifest {
  version: 1
  /** When false, the public demo shows a friendly unavailable message. */
  enabled: boolean
  /** ISO timestamp of the last publish. */
  publishedAt: string | null
  playlists: DemoPlaylist[]
}

/** The public view of the manifest (identical shape; documented separately so
 * callers are explicit that this is what crosses the network to visitors). */
export type PublicDemoManifest = DemoManifest

// ---------------------------------------------------------------------------
// R2 client (mirrors lib/r2-admin.ts; read at request time).
// ---------------------------------------------------------------------------
function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucketName = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  return { accessKeyId, secretAccessKey, bucketName, endpoint }
}

function createR2Client(): { client: S3Client; bucket: string } | null {
  const { accessKeyId, secretAccessKey, bucketName, endpoint } = getR2Config()
  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) return null
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
  return { client, bucket: bucketName }
}

export function isDemoStorageConfigured(): boolean {
  return createR2Client() !== null
}

// ---------------------------------------------------------------------------
// Manifest read / write
// ---------------------------------------------------------------------------
async function streamToBuffer(body: unknown): Promise<Buffer> {
  // Node stream (has async iterator) OR web ReadableStream.
  const anyBody = body as {
    [Symbol.asyncIterator]?: unknown
    getReader?: () => ReadableStreamDefaultReader<Uint8Array>
    transformToByteArray?: () => Promise<Uint8Array>
  }
  if (typeof anyBody?.transformToByteArray === 'function') {
    return Buffer.from(await anyBody.transformToByteArray())
  }
  if (typeof anyBody?.[Symbol.asyncIterator] !== 'undefined') {
    const chunks: Buffer[] = []
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  if (typeof anyBody?.getReader === 'function') {
    const reader = anyBody.getReader!()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)))
  }
  throw new Error('Unsupported R2 body stream type')
}

/**
 * Read the demo manifest. Returns a safe empty/disabled manifest when nothing
 * has been published yet or storage is unconfigured — callers treat that as
 * "demo unavailable" and NEVER fall back to private files.
 */
export async function readManifest(): Promise<DemoManifest> {
  const empty: DemoManifest = {
    version: 1,
    enabled: false,
    publishedAt: null,
    playlists: [],
  }
  const r2 = createR2Client()
  if (!r2) return empty
  try {
    const res = await r2.client.send(
      new GetObjectCommand({ Bucket: r2.bucket, Key: MANIFEST_KEY }),
    )
    if (!res.Body) return empty
    const buf = await streamToBuffer(res.Body)
    const parsed = JSON.parse(buf.toString('utf-8')) as DemoManifest
    if (parsed?.version !== 1 || !Array.isArray(parsed.playlists)) return empty
    return parsed
  } catch {
    // NoSuchKey / parse error → treat as not-yet-published.
    return empty
  }
}

async function writeManifest(manifest: DemoManifest): Promise<void> {
  const r2 = createR2Client()
  if (!r2) throw new Error('Demo storage not configured')
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(manifest), 'utf-8'),
      ContentType: 'application/json',
      CacheControl: 'no-store',
    }),
  )
}

// ---------------------------------------------------------------------------
// Metadata stripping (best-effort, no dependencies).
// Removes an ID3v2 tag (front) and an ID3v1 tag (last 128 bytes). This drops
// embedded artwork, comments and path/comment frames that commonly live in
// ID3v2 without re-encoding the audio. Full transcoding/bitrate reduction is
// out of scope without a media pipeline.
// ---------------------------------------------------------------------------
function stripAudioMetadata(input: Buffer): Buffer {
  let buf = input

  // ID3v2: "ID3" + ver(2) + flags(1) + synchsafe size(4).
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const flags = buf[5]
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f)
    const footerSize = flags & 0x10 ? 10 : 0
    const tagSize = 10 + size + footerSize
    if (tagSize > 0 && tagSize < buf.length) {
      buf = buf.subarray(tagSize)
    }
  }

  // ID3v1: last 128 bytes beginning with "TAG".
  if (buf.length > 128) {
    const tagStart = buf.length - 128
    if (
      buf[tagStart] === 0x54 &&
      buf[tagStart + 1] === 0x41 &&
      buf[tagStart + 2] === 0x47
    ) {
      buf = buf.subarray(0, tagStart)
    }
  }

  return buf
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------
export interface PublishTrackInput {
  /** The admin's own R2 source key: users/{adminId}/playlists/.../file. */
  sourceKey: string
  /** Public display name for the track. */
  name: string
  durationSeconds: number
}

export interface PublishPlaylistInput {
  name: string
  tracks: PublishTrackInput[]
}

/**
 * Copy the selected audio into the demo/ prefix (stripping metadata) and write a
 * fresh manifest. `adminUserId` is used ONLY to validate that every source key
 * belongs to the admin — it is never written into the public manifest.
 *
 * Replacing an existing snapshot: old demo objects are cleared first, so the demo
 * always reflects exactly the latest publish.
 */
export async function publishSnapshot(
  adminUserId: string,
  playlists: PublishPlaylistInput[],
): Promise<{ ok: boolean; error?: string }> {
  const r2 = createR2Client()
  if (!r2) return { ok: false, error: 'Demo storage not configured' }

  // Validate shape: 1–3 playlists, each with at least one track (and a sane
  // upper bound to keep the fixed demo small). The old "exactly 2×5" rule was
  // relaxed so the snapshot can mirror the real folder structure.
  if (playlists.length < 1 || playlists.length > MAX_PLAYLISTS) {
    return { ok: false, error: `Between 1 and ${MAX_PLAYLISTS} playlists are required` }
  }
  for (const p of playlists) {
    if (p.tracks.length < 1 || p.tracks.length > MAX_TRACKS_PER_PLAYLIST) {
      return {
        ok: false,
        error: `Each playlist must have 1–${MAX_TRACKS_PER_PLAYLIST} tracks`,
      }
    }
    for (const t of p.tracks) {
      // Defence-in-depth: never copy from anywhere but the admin's own space.
      if (!t.sourceKey.startsWith(`users/${adminUserId}/`)) {
        return { ok: false, error: 'A selected track is not owned by this account' }
      }
    }
  }

  // Clear any previous demo audio so a replace is clean.
  await clearDemoAudio()

  const manifestPlaylists: DemoPlaylist[] = []

  for (let pi = 0; pi < playlists.length; pi++) {
    const p = playlists[pi]
    const playlistId = `p${pi + 1}`
    const tracks: DemoTrack[] = []

    for (let ti = 0; ti < p.tracks.length; ti++) {
      const t = p.tracks[ti]
      const audioKey = `${DEMO_PREFIX}audio/${playlistId}/${ti + 1}.mp3`

      // Download source bytes, strip metadata, upload to demo/ prefix.
      const src = await r2.client.send(
        new GetObjectCommand({ Bucket: r2.bucket, Key: t.sourceKey }),
      )
      if (!src.Body) {
        return { ok: false, error: `Source audio missing: ${t.name}` }
      }
      const raw = await streamToBuffer(src.Body)
      const cleaned = stripAudioMetadata(raw)

      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: audioKey,
          Body: cleaned,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
          // Deliberately NO Metadata block — no user id, title, path, etc.
        }),
      )

      tracks.push({
        id: `${playlistId}-t${ti + 1}`,
        name: t.name,
        durationSeconds: Math.max(0, Math.round(t.durationSeconds)),
        audioKey,
      })
    }

    manifestPlaylists.push({ id: playlistId, name: p.name, tracks })
  }

  const manifest: DemoManifest = {
    version: 1,
    enabled: true,
    publishedAt: new Date().toISOString(),
    playlists: manifestPlaylists,
  }
  await writeManifest(manifest)
  return { ok: true }
}

/** Enable/disable the public demo without deleting the snapshot. */
export async function setDemoEnabled(
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const manifest = await readManifest()
  if (!manifest.publishedAt) {
    return { ok: false, error: 'Nothing has been published yet' }
  }
  await writeManifest({ ...manifest, enabled })
  return { ok: true }
}

/** Delete every demo audio object (used before a replace). Manifest untouched. */
async function clearDemoAudio(): Promise<void> {
  const r2 = createR2Client()
  if (!r2) return
  const prefix = `${DEMO_PREFIX}audio/`
  let continuationToken: string | undefined
  do {
    const listed = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )
    const objects = (listed.Contents || [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.startsWith(prefix))
      .map((Key) => ({ Key }))
    if (objects.length > 0) {
      await r2.client.send(
        new DeleteObjectsCommand({
          Bucket: r2.bucket,
          Delete: { Objects: objects, Quiet: true },
        }),
      )
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)
}

// ---------------------------------------------------------------------------
// Public audio streaming (proxied so the R2 endpoint/URL is never exposed).
// Only serves keys under demo/audio/ — never private user keys.
// ---------------------------------------------------------------------------
export interface DemoAudioResult {
  body: ReadableStream
  contentType: string
  contentLength?: number
}

export async function getDemoAudioStream(
  audioKey: string,
): Promise<DemoAudioResult | null> {
  const r2 = createR2Client()
  if (!r2) return null
  // Hard guard: only demo audio, nothing else.
  if (!audioKey.startsWith(`${DEMO_PREFIX}audio/`) || audioKey.includes('..')) {
    return null
  }
  try {
    const res = await r2.client.send(
      new GetObjectCommand({ Bucket: r2.bucket, Key: audioKey }),
    )
    if (!res.Body) return null
    return {
      body: res.Body as unknown as ReadableStream,
      contentType: res.ContentType || 'audio/mpeg',
      contentLength: res.ContentLength,
    }
  } catch {
    return null
  }
}
