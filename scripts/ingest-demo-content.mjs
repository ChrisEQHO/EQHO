/**
 * One-off ingestion for the PUBLIC interactive demo snapshot.
 *
 * Downloads the provided training tracks, strips ID3 metadata, uploads them into
 * the `demo/` prefix of the R2 bucket, and writes `demo/manifest.json` in the
 * exact shape lib/demo/demo-storage.ts reads. This is the direct-from-URL
 * equivalent of the admin "publish" flow (which copies from an admin's own R2
 * keys). It NEVER touches `users/...` objects.
 *
 * Run with R2 credentials in the environment:
 *   set -a && source /vercel/share/.env.project && set +a \
 *     && node scripts/ingest-demo-content.mjs
 */

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

const DEMO_PREFIX = 'demo/'
const MANIFEST_KEY = 'demo/manifest.json'

// ---------------------------------------------------------------------------
// Content: 3 playlists (folders) in order NDP → DEV → FIG. Track order within
// each mirrors the folder view. Names are used exactly as the filenames.
// ---------------------------------------------------------------------------
const PLAYLISTS = [
  {
    name: 'NDP Group',
    tracks: [
      {
        name: 'GRACE, BEA & ZARA',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/GRACE%2C%20BEA%20%26%20ZARA-zeht5K7mfHSFL0oowddj7PwJB8aycx.mp3',
      },
      {
        name: 'JULIE, SOPHIA & LILLY',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JULIE%2C%20SOPHIA%20%26%20LILLY-Gxa40Em8iZG3Agw8t8hJpOxJpnHEwC.mp3',
      },
      {
        name: 'NICK & JOSH',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/NICK%20%26%20JOSH-BIdkk62AR9h09QHkZGgXUZUWi8pVHc.mp3',
      },
    ],
  },
  {
    name: 'DEV Group',
    tracks: [
      {
        name: 'JAKE & AMELIA',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JAKE%20%26%20AMELIA-YlUfmSHSrq6lzcuIooQA5Po3ymfnpA.mp3',
      },
      {
        name: 'AMY & SOPHIE',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AMY%20%26%20SOPHIE-rVw8JTiOu0XiW7OX8F2Oxdequdn8PN.mp3',
      },
      {
        name: 'JESS & LIV',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JESS%20%26%20LIV-TigrUmiWCWT6xRSw4NBaLPYqIkEuOt.mp3',
      },
    ],
  },
  {
    name: 'FIG Group',
    tracks: [
      {
        name: 'CHARLOTTE, EMMA & ROSIE BALANCE',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CHARLOTTE%2C%20EMMA%20%26%20ROSIE%20BALANCE-d5TPUECtT6UxMCIihWKaOi4bw1amHt.mp3',
      },
      {
        name: 'DANIEL & SOPHIA COMBINED',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DANIEL%20%26%20SOPHIA%20COMBINED-tojYWgVnoHF6RqH9c6N2JvNtYMJFra.mp3',
      },
      {
        name: 'EVIE & OLIVIA DYNAMIC',
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/EVIE%20%26%20OLIVIA%20DYNAMIC-kCZwjTpcfLyOTOYUHbxTdJHtFgzobn.mp3',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// R2 client (same env names as lib/r2-admin.ts / lib/demo/demo-storage.ts).
// ---------------------------------------------------------------------------
function createR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error('Missing R2 env (R2_ACCESS_KEY_ID/SECRET/BUCKET/ENDPOINT or ACCOUNT_ID)')
  }
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
  return { client, bucket }
}

// ---------------------------------------------------------------------------
// Metadata stripping — identical to lib/demo/demo-storage.ts (ID3v2 + ID3v1).
// ---------------------------------------------------------------------------
function stripAudioMetadata(input) {
  let buf = input
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const flags = buf[5]
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f)
    const footerSize = flags & 0x10 ? 10 : 0
    const tagSize = 10 + size + footerSize
    if (tagSize > 0 && tagSize < buf.length) buf = buf.subarray(tagSize)
  }
  if (buf.length > 128) {
    const tagStart = buf.length - 128
    if (buf[tagStart] === 0x54 && buf[tagStart + 1] === 0x41 && buf[tagStart + 2] === 0x47) {
      buf = buf.subarray(0, tagStart)
    }
  }
  return buf
}

// ---------------------------------------------------------------------------
// MP3 duration: parse the first audio frame; use the Xing/Info VBR frame count
// when present (accurate for VBR), else fall back to a CBR estimate.
// ---------------------------------------------------------------------------
function mp3DurationSeconds(buf) {
  let offset = 0
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f)
    offset = 10 + size
  }
  const V1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
  const V2L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]

  for (let i = offset; i < buf.length - 4; i++) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) continue
    const b1 = buf[i + 1]
    const b2 = buf[i + 2]
    const b3 = buf[i + 3]
    const versionBits = (b1 >> 3) & 0x03 // 0=2.5, 2=2, 3=1
    const layerBits = (b1 >> 1) & 0x03 // 1=L3
    if (versionBits === 1 || layerBits === 0) continue // reserved
    if (layerBits !== 1) continue // demo files are Layer III
    const bitrateIndex = (b2 >> 4) & 0x0f
    const sampleRateIndex = (b2 >> 2) & 0x03
    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) continue
    const mpeg1 = versionBits === 3
    const bitrate = (mpeg1 ? V1L3 : V2L3)[bitrateIndex] * 1000
    const sampleRates = mpeg1
      ? [44100, 48000, 32000]
      : versionBits === 2
        ? [22050, 24000, 16000]
        : [11025, 12000, 8000]
    const sampleRate = sampleRates[sampleRateIndex]
    const samplesPerFrame = mpeg1 ? 1152 : 576
    const channelMode = (b3 >> 6) & 0x03
    const mono = channelMode === 3
    const sideInfo = mpeg1 ? (mono ? 17 : 32) : mono ? 9 : 17
    const xingOff = i + 4 + sideInfo
    if (xingOff + 12 <= buf.length) {
      const tag = buf.subarray(xingOff, xingOff + 4).toString('latin1')
      if (tag === 'Xing' || tag === 'Info') {
        const flags = buf.readUInt32BE(xingOff + 4)
        if (flags & 0x01) {
          const frames = buf.readUInt32BE(xingOff + 8)
          if (frames > 0) return (frames * samplesPerFrame) / sampleRate
        }
      }
    }
    const audioBytes = buf.length - i
    return (audioBytes * 8) / bitrate
  }
  return 0
}

async function clearDemoAudio(client, bucket) {
  const prefix = `${DEMO_PREFIX}audio/`
  let token
  do {
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    )
    const objects = (listed.Contents || [])
      .map((o) => o.Key)
      .filter((k) => !!k && k.startsWith(prefix))
      .map((Key) => ({ Key }))
    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }),
      )
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (token)
}

async function main() {
  const { client, bucket } = createR2Client()
  console.log(`[ingest] bucket=${bucket} — clearing previous demo audio…`)
  await clearDemoAudio(client, bucket)

  const manifestPlaylists = []
  let totalSeconds = 0

  for (let pi = 0; pi < PLAYLISTS.length; pi++) {
    const p = PLAYLISTS[pi]
    const playlistId = `p${pi + 1}`
    const tracks = []
    console.log(`\n[ingest] ${p.name} (${playlistId})`)

    for (let ti = 0; ti < p.tracks.length; ti++) {
      const t = p.tracks[ti]
      const res = await fetch(t.url)
      if (!res.ok) throw new Error(`Download failed (${res.status}) for ${t.name}`)
      const raw = Buffer.from(await res.arrayBuffer())
      const isMp3 = raw[0] === 0x49 || raw[0] === 0xff // ID3 or frame sync
      if (!isMp3) throw new Error(`Not an MP3: ${t.name}`)
      const cleaned = stripAudioMetadata(raw)
      const duration = Math.max(1, Math.round(mp3DurationSeconds(cleaned)))
      const audioKey = `${DEMO_PREFIX}audio/${playlistId}/${ti + 1}.mp3`

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: audioKey,
          Body: cleaned,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )

      const mm = Math.floor(duration / 60)
      const ss = String(duration % 60).padStart(2, '0')
      console.log(
        `  ✓ ${t.name}  (${mm}:${ss}, ${(cleaned.length / 1024 / 1024).toFixed(2)} MB)`,
      )
      totalSeconds += duration
      tracks.push({ id: `${playlistId}-t${ti + 1}`, name: t.name, durationSeconds: duration, audioKey })
    }
    manifestPlaylists.push({ id: playlistId, name: p.name, tracks })
  }

  const manifest = {
    version: 1,
    enabled: true,
    publishedAt: new Date().toISOString(),
    playlists: manifestPlaylists,
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(manifest), 'utf-8'),
      ContentType: 'application/json',
      CacheControl: 'no-store',
    }),
  )

  const total = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
  const count = manifestPlaylists.reduce((n, p) => n + p.tracks.length, 0)
  console.log(
    `\n[ingest] Published manifest: ${manifestPlaylists.length} playlists, ${count} tracks, ${total} total.`,
  )
}

main().catch((err) => {
  console.error('[ingest] FAILED:', err)
  process.exit(1)
})
