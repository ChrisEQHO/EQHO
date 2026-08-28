#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * EQHO — Interactive demo content ingestion (LOCAL, run on your Mac)
 * ---------------------------------------------------------------------------
 *
 * This script reads local MP3 files and publishes them as the FIXED public
 * demo snapshot into Cloudflare R2, in the EXACT format the existing
 * interactive demo already consumes (see lib/demo/demo-storage.ts):
 *
 *   - audio objects:  demo/audio/p{playlist}/{track}.mp3   (audio/mpeg)
 *   - manifest:       demo/manifest.json                    (application/json)
 *
 * It is deliberately isolated:
 *   - It ONLY ever writes under the `demo/` key prefix.
 *   - It NEVER reads, writes, moves, renames or deletes anything under the
 *     customer `users/` prefix.
 *   - It does not touch the website, the main player, auth, Supabase, Stripe or
 *     any other functionality — it is a standalone Node script.
 *
 * WHY LOCAL: the copyrighted audio and the R2 write credentials only exist on
 * your machine, so this must be run there — never from the hosted sandbox.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 * ---------------------------------------------------------------------------
 * 1. Put the audio in this structure at the project root (folder = playlist):
 *
 *      demo-source/NDP GROUP/<three>.mp3
 *      demo-source/DEV GROUP/<three>.mp3
 *      demo-source/FIG GROUP/<three>.mp3
 *
 *    Each folder must contain exactly three .mp3 files.
 *
 * 2. Provide the R2 credentials as environment variables. Either export them,
 *    or put them in a local env file and pass it with Node's --env-file flag:
 *
 *      node --env-file=.env.local scripts/ingest-demo-content.mjs
 *
 *    (This script also auto-loads .env.local / .env from the project root if
 *    present, so a bare `node scripts/ingest-demo-content.mjs` works too.)
 *
 *    Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and
 *    either R2_ENDPOINT or R2_ACCOUNT_ID.
 *
 * 3. Run it. Add --dry-run to validate + compute durations WITHOUT uploading.
 * ---------------------------------------------------------------------------
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Small helpers for readable, coloured progress output.
// ---------------------------------------------------------------------------
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}
const log = (...a) => console.log(...a)
const info = (m) => log(`${c.cyan}•${c.reset} ${m}`)
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`)
const warn = (m) => log(`${c.yellow}!${c.reset} ${m}`)
const step = (m) => log(`\n${c.bold}${m}${c.reset}`)
function fail(m) {
  log(`\n${c.red}✗ ${m}${c.reset}\n`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Constants that MUST match lib/demo/demo-storage.ts exactly.
// ---------------------------------------------------------------------------
const DEMO_PREFIX = 'demo/'
const MANIFEST_KEY = 'demo/manifest.json'
const AUDIO_PREFIX = 'demo/audio/'
const MAX_PLAYLISTS = 3
const MAX_TRACKS_PER_PLAYLIST = 10

// Deterministic playlist ordering. Folders matching these names publish in this
// order; any other folders are appended alphabetically afterwards.
const PREFERRED_FOLDER_ORDER = ['NDP GROUP', 'DEV GROUP', 'FIG GROUP']

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(PROJECT_ROOT, 'demo-source')
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Minimal .env loader (no dependency). Loads .env.local then .env from the
// project root, without overwriting variables already set in the environment.
// ---------------------------------------------------------------------------
function loadEnvFile(file) {
  if (!existsSync(file)) return
  const text = readFileSync(file, 'utf-8')
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnvFile(path.join(PROJECT_ROOT, '.env.local'))
loadEnvFile(path.join(PROJECT_ROOT, '.env'))

// ---------------------------------------------------------------------------
// Accurate MP3 duration by walking MPEG audio frames (no dependency).
// Falls back to a Xing/Info VBR header or a CBR estimate if frame walking
// cannot proceed. This yields the real playing time for standard MP3s.
// ---------------------------------------------------------------------------
const BITRATES = {
  // [version][layer][index]  version: 1=MPEG1, 2=MPEG2/2.5   layer: 1..3
  1: {
    1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  },
  2: {
    1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
    3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  },
}
const SAMPLE_RATES = {
  // versionId bits: 3=MPEG1, 2=MPEG2, 0=MPEG2.5
  3: [44100, 48000, 32000, 0],
  2: [22050, 24000, 16000, 0],
  0: [11025, 12000, 8000, 0],
}

function id3v2Size(buf) {
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0
  const size =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f)
  return 10 + size
}

function mp3DurationSeconds(buf) {
  const start = id3v2Size(buf)
  let pos = start
  let duration = 0
  let frames = 0

  // Find the first frame sync.
  function findSync(from) {
    for (let i = from; i < buf.length - 4; i++) {
      if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) return i
    }
    return -1
  }

  pos = findSync(pos)
  if (pos === -1) return 0

  // Check the first frame for a Xing/Info VBR header (exact frame count).
  const firstHeaderPos = pos
  const b1 = buf[firstHeaderPos + 1]
  const versionId = (b1 >> 3) & 0x03
  const sampleRate = (SAMPLE_RATES[versionId] || [])[(buf[firstHeaderPos + 2] >> 2) & 0x03] || 0
  const samplesPerFrameFirst = versionId === 3 ? 1152 : 576
  const scanEnd = Math.min(firstHeaderPos + 240, buf.length - 8)
  for (let i = firstHeaderPos; i < scanEnd; i++) {
    const tag = buf.toString('ascii', i, i + 4)
    if (tag === 'Xing' || tag === 'Info') {
      const flags = buf.readUInt32BE(i + 4)
      if (flags & 0x0001 && sampleRate) {
        const frameCount = buf.readUInt32BE(i + 8)
        const secs = (frameCount * samplesPerFrameFirst) / sampleRate
        if (secs > 0 && Number.isFinite(secs)) return secs
      }
      break
    }
  }

  // Otherwise walk every frame and sum their durations (accurate for CBR & VBR).
  let guard = 0
  while (pos < buf.length - 4) {
    if (++guard > 2_000_000) break // safety
    if (buf[pos] !== 0xff || (buf[pos + 1] & 0xe0) !== 0xe0) {
      const next = findSync(pos + 1)
      if (next === -1) break
      pos = next
      continue
    }
    const h1 = buf[pos + 1]
    const h2 = buf[pos + 2]
    const vId = (h1 >> 3) & 0x03 // 3=MPEG1,2=MPEG2,0=MPEG2.5
    const layerBits = (h1 >> 1) & 0x03 // 1=LayerIII,2=LayerII,3=LayerI
    const brIndex = (h2 >> 4) & 0x0f
    const srIndex = (h2 >> 2) & 0x03
    const padding = (h2 >> 1) & 0x01

    if (vId === 1 || layerBits === 0 || brIndex === 0 || brIndex === 15 || srIndex === 3) {
      const next = findSync(pos + 1)
      if (next === -1) break
      pos = next
      continue
    }

    const layer = layerBits === 3 ? 1 : layerBits === 2 ? 2 : 3
    const verGroup = vId === 3 ? 1 : 2
    const bitrate = (BITRATES[verGroup]?.[layer] || [])[brIndex] * 1000
    const sr = (SAMPLE_RATES[vId] || [])[srIndex]
    if (!bitrate || !sr) {
      const next = findSync(pos + 1)
      if (next === -1) break
      pos = next
      continue
    }

    let frameLen
    let samples
    if (layer === 1) {
      frameLen = Math.floor((12 * bitrate) / sr + padding) * 4
      samples = 384
    } else {
      const coef = layer === 3 && vId !== 3 ? 72 : 144
      frameLen = Math.floor((coef * bitrate) / sr + padding)
      samples = layer === 3 && vId !== 3 ? 576 : layer === 1 ? 384 : 1152
    }
    if (!frameLen || frameLen < 1) {
      const next = findSync(pos + 1)
      if (next === -1) break
      pos = next
      continue
    }

    duration += samples / sr
    frames++
    pos += frameLen
  }

  if (frames > 0 && duration > 0 && Number.isFinite(duration)) return duration

  // Last-resort CBR estimate from the first frame's bitrate.
  const brIdx = (buf[firstHeaderPos + 2] >> 4) & 0x0f
  const vGroup = versionId === 3 ? 1 : 2
  const layerBitsF = (b1 >> 1) & 0x03
  const layerF = layerBitsF === 3 ? 1 : layerBitsF === 2 ? 2 : 3
  const br = (BITRATES[vGroup]?.[layerF] || [])[brIdx] * 1000
  if (br) {
    const audioBytes = buf.length - start
    const secs = (audioBytes * 8) / br
    if (secs > 0 && Number.isFinite(secs)) return secs
  }
  return 0
}

/** Try music-metadata for maximum accuracy; fall back to the built-in parser. */
async function getDurationSeconds(buf, label) {
  try {
    const mm = await import('music-metadata')
    const meta = await mm.parseBuffer(buf, { mimeType: 'audio/mpeg' }, { duration: true })
    const d = meta?.format?.duration
    if (typeof d === 'number' && d > 0 && Number.isFinite(d)) return d
  } catch {
    // music-metadata not installed — fine, use the built-in parser.
  }
  const d = mp3DurationSeconds(buf)
  if (!d) warn(`Could not determine duration for "${label}" — storing 0.`)
  return d
}

// ---------------------------------------------------------------------------
// Read + validate the local source folders.
// ---------------------------------------------------------------------------
async function readSource() {
  if (!existsSync(SOURCE_DIR)) {
    fail(
      `Source folder not found: ${SOURCE_DIR}\n` +
        `  Create it with one sub-folder per playlist, e.g.\n` +
        `    demo-source/NDP GROUP/*.mp3\n` +
        `    demo-source/DEV GROUP/*.mp3\n` +
        `    demo-source/FIG GROUP/*.mp3`,
    )
  }

  const entries = await readdir(SOURCE_DIR, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  if (folders.length === 0) fail(`No playlist folders found inside ${SOURCE_DIR}`)
  if (folders.length > MAX_PLAYLISTS) {
    fail(`Found ${folders.length} folders but the demo allows at most ${MAX_PLAYLISTS}.`)
  }

  // Order: preferred names first (in the defined order), then any extras A→Z.
  const ordered = [
    ...PREFERRED_FOLDER_ORDER.filter((n) => folders.includes(n)),
    ...folders.filter((n) => !PREFERRED_FOLDER_ORDER.includes(n)).sort(),
  ]

  const playlists = []
  for (const folder of ordered) {
    const dir = path.join(SOURCE_DIR, folder)
    const files = (await readdir(dir))
      .filter((f) => f.toLowerCase().endsWith('.mp3') && !f.startsWith('.'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    if (files.length !== 3) {
      fail(
        `Folder "${folder}" contains ${files.length} MP3 file(s); exactly 3 are required.`,
      )
    }
    if (files.length > MAX_TRACKS_PER_PLAYLIST) {
      fail(`Folder "${folder}" exceeds the ${MAX_TRACKS_PER_PLAYLIST}-track limit.`)
    }

    const tracks = []
    for (const file of files) {
      const full = path.join(dir, file)
      const s = await stat(full)
      if (!s.isFile() || s.size === 0) fail(`"${folder}/${file}" is empty or not a file.`)
      tracks.push({
        // Track name = filename minus the .mp3 extension (only the extension).
        name: file.replace(/\.mp3$/i, ''),
        filePath: full,
        sizeBytes: s.size,
      })
    }
    playlists.push({ name: folder, dir, tracks })
  }
  return playlists
}

// ---------------------------------------------------------------------------
// R2 client (mirrors lib/demo/demo-storage.ts).
// ---------------------------------------------------------------------------
function resolveR2Env() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  const missing = []
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID')
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY')
  if (!bucket) missing.push('R2_BUCKET_NAME')
  if (!endpoint) missing.push('R2_ENDPOINT (or R2_ACCOUNT_ID)')
  return { accessKeyId, secretAccessKey, bucket, endpoint, missing }
}

async function createClient(env) {
  let mod
  try {
    mod = await import('@aws-sdk/client-s3')
  } catch {
    fail(
      `Could not load @aws-sdk/client-s3.\n` +
        `  Run this script from the project root after installing dependencies:\n` +
        `    npm install   (or pnpm install)`,
    )
  }
  const { S3Client } = mod
  return {
    mod,
    client: new S3Client({
      region: 'auto',
      endpoint: env.endpoint,
      credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
    }),
  }
}

/** Delete every existing object under demo/audio/ (clean replace). */
async function clearDemoAudio({ client, mod, bucket }) {
  const { ListObjectsV2Command, DeleteObjectsCommand } = mod
  let continuationToken
  let deleted = 0
  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: AUDIO_PREFIX,
        ContinuationToken: continuationToken,
      }),
    )
    const objects = (listed.Contents || [])
      .map((o) => o.Key)
      .filter((k) => !!k && k.startsWith(AUDIO_PREFIX))
      .map((Key) => ({ Key }))
    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
      )
      deleted += objects.length
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)
  return deleted
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  step('EQHO interactive-demo ingestion')
  info(`Project root : ${PROJECT_ROOT}`)
  info(`Source dir   : ${SOURCE_DIR}`)
  if (DRY_RUN) warn('DRY RUN — validating and computing durations, no uploads.')

  // 1) Read + validate local content.
  step('1. Reading local source folders')
  const playlists = await readSource()
  for (const p of playlists) {
    ok(`Playlist "${p.name}" — ${p.tracks.length} tracks`)
    for (const t of p.tracks) log(`    ${c.dim}- ${t.name}${c.reset}`)
  }

  // 2) Compute real durations from the audio bytes.
  step('2. Computing audio durations')
  for (const p of playlists) {
    for (const t of p.tracks) {
      const buf = await readFile(t.filePath)
      t.buffer = buf
      t.durationSeconds = Math.max(0, Math.round(await getDurationSeconds(buf, t.name)))
      const mm = Math.floor(t.durationSeconds / 60)
      const ss = String(t.durationSeconds % 60).padStart(2, '0')
      ok(`${p.name} / ${t.name} → ${mm}:${ss} (${(t.sizeBytes / 1_048_576).toFixed(2)} MB)`)
    }
  }

  // 3) Build the manifest EXACTLY as lib/demo/demo-storage.ts does.
  const manifest = {
    version: 1,
    enabled: true,
    publishedAt: new Date().toISOString(),
    playlists: playlists.map((p, pi) => {
      const playlistId = `p${pi + 1}`
      return {
        id: playlistId,
        name: p.name,
        tracks: p.tracks.map((t, ti) => ({
          id: `${playlistId}-t${ti + 1}`,
          name: t.name,
          durationSeconds: t.durationSeconds,
          audioKey: `${DEMO_PREFIX}audio/${playlistId}/${ti + 1}.mp3`,
        })),
      }
    }),
  }

  if (DRY_RUN) {
    step('Dry run complete — manifest preview')
    log(JSON.stringify(manifest, null, 2))
    log(`\n${c.green}✓ Validation passed. Re-run without --dry-run to upload.${c.reset}\n`)
    return
  }

  // 4) Connect to R2.
  step('3. Connecting to Cloudflare R2')
  const env = resolveR2Env()
  if (env.missing.length) {
    fail(
      `Missing required environment variable(s): ${env.missing.join(', ')}\n` +
        `  Set them in your shell or a local .env.local file, e.g.\n` +
        `    node --env-file=.env.local scripts/ingest-demo-content.mjs`,
    )
  }
  const { client, mod } = await createClient(env)
  const { PutObjectCommand } = mod
  ok(`Bucket "${env.bucket}" @ ${env.endpoint}`)

  // 5) Clean-replace existing demo audio (only under demo/audio/).
  step('4. Clearing previous demo audio (demo/audio/ only)')
  const removed = await clearDemoAudio({ client, mod, bucket: env.bucket })
  ok(removed > 0 ? `Removed ${removed} old object(s).` : 'Nothing to remove.')

  // 6) Upload audio copies under demo/audio/.
  step('5. Uploading audio to demo/audio/')
  for (const pl of manifest.playlists) {
    const source = playlists[Number(pl.id.slice(1)) - 1]
    for (let i = 0; i < pl.tracks.length; i++) {
      const track = pl.tracks[i]
      const body = source.tracks[i].buffer
      await client.send(
        new PutObjectCommand({
          Bucket: env.bucket,
          Key: track.audioKey,
          Body: body,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
          // No Metadata block — keep the public copy free of tags/paths.
        }),
      )
      ok(`${track.audioKey}  ${c.dim}(${track.name})${c.reset}`)
    }
  }

  // 7) Upload the manifest LAST so readers never see a half-published state.
  step('6. Writing demo/manifest.json')
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(manifest), 'utf-8'),
      ContentType: 'application/json',
      CacheControl: 'no-store',
    }),
  )
  ok(`${MANIFEST_KEY} written.`)

  const trackCount = manifest.playlists.reduce((n, p) => n + p.tracks.length, 0)
  step('Done')
  ok(
    `Published ${manifest.playlists.length} playlist(s), ${trackCount} track(s) to the ` +
      `demo/ prefix. The interactive demo will now serve this content.`,
  )
  log('')
}

main().catch((err) => {
  fail(err?.stack || err?.message || String(err))
})
