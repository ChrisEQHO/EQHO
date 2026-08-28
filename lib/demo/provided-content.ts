import 'server-only'
import type { SourcePlaylistInput } from './demo-storage'

/**
 * The demo content supplied directly for the interactive demo, logged here as a
 * fixed, ordered snapshot. Publishing this ingests each file into the demo/
 * prefix in R2 (see publishSnapshotFromSources) — it never touches customer data.
 *
 * Structure mirrors the source folders exactly:
 *   NDP Group → DEV Group → FIG Group
 * Track display names use the original filenames as-is (per request). The blob
 * URLs are persistent public storage URLs and only need to be reachable at the
 * moment of publishing.
 */
export const PROVIDED_DEMO_CONTENT: SourcePlaylistInput[] = [
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
