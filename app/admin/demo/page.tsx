'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/access'
import { fetchCloudPlaylists, getTrackStreamUrl, type CloudPlaylist } from '@/lib/cloud-sync'
import { Play, Pause, Loader2, Check, AlertTriangle } from 'lucide-react'

/**
 * Administrator-only workflow to publish the fixed public demo snapshot.
 *
 * It reads ONLY the signed-in admin's own playlists/tracks (RLS-scoped via the
 * existing cloud-sync fetchers), never auto-publishes, and requires an explicit
 * final confirmation of exactly two playlists and ten tracks plus a permission
 * checkbox before calling the admin publish API.
 */

type Phase =
  | 'checking'
  | 'unauthorized'
  | 'overview'
  | 'pick-playlists'
  | 'pick-tracks'
  | 'review'
  | 'publishing'
  | 'done'

interface TrackEdit {
  selected: boolean
  name: string
}
interface PlaylistEdit {
  name: string
  tracks: Record<string, TrackEdit>
}

interface DemoStatus {
  configured: boolean
  enabled: boolean
  publishedAt: string | null
  playlists: { name: string; trackCount: number; trackNames: string[] }[]
}

const MAX_PLAYLISTS = 2
const TRACKS_PER_PLAYLIST = 5

export default function AdminDemoPage() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<DemoStatus | null>(null)

  const [playlists, setPlaylists] = useState<CloudPlaylist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([])
  const [edits, setEdits] = useState<Record<string, PlaylistEdit>>({})
  const [confirmPermission, setConfirmPermission] = useState(false)

  // Single audio element for previews — only one track plays at a time.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewingKey, setPreviewingKey] = useState<string | null>(null)
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null)

  // ---- Auth gate ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      if (!supabase) {
        if (!cancelled) setPhase('unauthorized')
        return
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user || !isAdminEmail(user.email)) {
        setPhase('unauthorized')
        return
      }
      await refreshStatus()
      if (!cancelled) setPhase('overview')
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/demo/admin', { cache: 'no-store' })
      if (res.ok) setStatus((await res.json()) as DemoStatus)
    } catch {
      /* non-fatal */
    }
  }, [])

  // ---- Preview audio -----------------------------------------------------
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setPreviewingKey(null)
  }, [])

  useEffect(() => () => stopPreview(), [stopPreview])

  const togglePreview = useCallback(
    async (key: string, storagePath: string) => {
      if (previewingKey === key) {
        stopPreview()
        return
      }
      stopPreview()
      setPreviewLoadingKey(key)
      try {
        const url = await getTrackStreamUrl(storagePath)
        if (!url) {
          setError('Could not load audio preview for that track.')
          return
        }
        if (!audioRef.current) audioRef.current = new Audio()
        audioRef.current.src = url
        audioRef.current.onended = () => setPreviewingKey(null)
        await audioRef.current.play()
        setPreviewingKey(key)
      } catch {
        setError('Preview playback failed (the browser may need another tap).')
      } finally {
        setPreviewLoadingKey(null)
      }
    },
    [previewingKey, stopPreview],
  )

  // ---- Load playlists ----------------------------------------------------
  const startSelection = useCallback(async () => {
    setError(null)
    setSelectedPlaylistIds([])
    setEdits({})
    setConfirmPermission(false)
    setLoadingPlaylists(true)
    setPhase('pick-playlists')
    try {
      const pls = await fetchCloudPlaylists()
      setPlaylists(pls)
    } catch {
      setError('Could not load your playlists.')
    } finally {
      setLoadingPlaylists(false)
    }
  }, [])

  const togglePlaylist = (id: string) => {
    setSelectedPlaylistIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= MAX_PLAYLISTS) return prev
      return [...prev, id]
    })
  }

  const goToTrackSelection = () => {
    const next: Record<string, PlaylistEdit> = {}
    for (const pid of selectedPlaylistIds) {
      const pl = playlists.find((p) => p.id === pid)
      if (!pl) continue
      const existing = edits[pid]
      next[pid] = {
        name: existing?.name ?? pl.name,
        tracks: Object.fromEntries(
          pl.tracks.map((t) => [
            t.id,
            existing?.tracks[t.id] ?? { selected: false, name: t.title },
          ]),
        ),
      }
    }
    setEdits(next)
    setError(null)
    setPhase('pick-tracks')
  }

  const toggleTrack = (pid: string, tid: string) => {
    setEdits((prev) => {
      const pe = prev[pid]
      if (!pe) return prev
      const selectedCount = Object.values(pe.tracks).filter((t) => t.selected).length
      const cur = pe.tracks[tid]
      if (!cur.selected && selectedCount >= TRACKS_PER_PLAYLIST) return prev
      return {
        ...prev,
        [pid]: {
          ...pe,
          tracks: { ...pe.tracks, [tid]: { ...cur, selected: !cur.selected } },
        },
      }
    })
  }

  const setPlaylistName = (pid: string, name: string) =>
    setEdits((prev) => ({ ...prev, [pid]: { ...prev[pid], name } }))

  const setTrackName = (pid: string, tid: string, name: string) =>
    setEdits((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        tracks: { ...prev[pid].tracks, [tid]: { ...prev[pid].tracks[tid], name } },
      },
    }))

  const tracksSelectedCount = (pid: string) =>
    Object.values(edits[pid]?.tracks ?? {}).filter((t) => t.selected).length

  const allValid =
    selectedPlaylistIds.length === MAX_PLAYLISTS &&
    selectedPlaylistIds.every((pid) => tracksSelectedCount(pid) === TRACKS_PER_PLAYLIST) &&
    selectedPlaylistIds.every((pid) => (edits[pid]?.name ?? '').trim().length > 0)

  // Build the review model (ordered exactly as the playlist track order).
  const reviewModel = selectedPlaylistIds.map((pid) => {
    const pl = playlists.find((p) => p.id === pid)!
    const pe = edits[pid]
    const tracks = pl.tracks
      .filter((t) => pe.tracks[t.id]?.selected)
      .map((t) => ({
        sourceKey: t.storage_path,
        name: (pe.tracks[t.id].name || t.title).trim(),
        durationSeconds: t.durationSeconds,
      }))
    return { name: pe.name.trim(), tracks }
  })

  const publish = useCallback(async () => {
    setError(null)
    stopPreview()
    setPhase('publishing')
    try {
      const res = await fetch('/api/demo/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          confirmPermission: true,
          playlists: reviewModel,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Publish failed.')
        setPhase('review')
        return
      }
      await refreshStatus()
      setPhase('done')
    } catch {
      setError('Publish request failed.')
      setPhase('review')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewModel, refreshStatus, stopPreview])

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      setError(null)
      try {
        const res = await fetch('/api/demo/admin', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: enabled ? 'enable' : 'disable' }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) setError(data.error || 'Could not update demo state.')
        await refreshStatus()
      } catch {
        setError('Request failed.')
      }
    },
    [refreshStatus],
  )

  // ---- Render ------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#ff8a00]">
            Administrator
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Demo setup</h1>
          <p className="mt-2 text-[#94a3b8]">
            Publish a fixed public snapshot from your own account. Two playlists, five
            tracks each. Your original playlists and files are never changed.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {phase === 'checking' && (
          <p className="flex items-center gap-2 text-[#94a3b8]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking access…
          </p>
        )}

        {phase === 'unauthorized' && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Not authorised</h2>
            <p className="mt-2 text-[#94a3b8]">
              This page is only available to EQHO administrators. Please{' '}
              <Link href="/login" className="text-white underline">
                log in
              </Link>{' '}
              with an administrator account.
            </p>
          </div>
        )}

        {phase === 'overview' && (
          <div className="space-y-6">
            <section className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Current public demo</h2>
              {status?.publishedAt ? (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-[#94a3b8]">
                    Status:{' '}
                    <span className={status.enabled ? 'text-green-400' : 'text-amber-400'}>
                      {status.enabled ? 'Live' : 'Disabled'}
                    </span>{' '}
                    · Published {new Date(status.publishedAt).toLocaleString()}
                  </p>
                  <ul className="space-y-2">
                    {status.playlists.map((p, i) => (
                      <li key={i} className="rounded-lg bg-black/30 p-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-[#94a3b8]">
                          {p.trackCount} tracks: {p.trackNames.join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {status.enabled ? (
                      <button
                        onClick={() => setEnabled(false)}
                        className="rounded-full border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10"
                      >
                        Disable public demo
                      </button>
                    ) : (
                      <button
                        onClick={() => setEnabled(true)}
                        className="rounded-full border border-green-400/40 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-400/10"
                      >
                        Enable public demo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[#94a3b8]">Nothing published yet.</p>
              )}
            </section>

            <button
              onClick={startSelection}
              className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 py-3 text-sm font-semibold text-white"
            >
              {status?.publishedAt ? 'Replace snapshot' : 'Create demo snapshot'}
            </button>
          </div>
        )}

        {phase === 'pick-playlists' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Select two playlists ({selectedPlaylistIds.length}/{MAX_PLAYLISTS})
              </h2>
              <button onClick={() => setPhase('overview')} className="text-sm text-[#94a3b8] hover:text-white">
                Cancel
              </button>
            </div>
            {loadingPlaylists ? (
              <p className="flex items-center gap-2 text-[#94a3b8]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your playlists…
              </p>
            ) : playlists.length === 0 ? (
              <p className="text-[#94a3b8]">No playlists found on your account.</p>
            ) : (
              <ul className="space-y-2">
                {playlists.map((p) => {
                  const checked = selectedPlaylistIds.includes(p.id)
                  const disabled = !checked && selectedPlaylistIds.length >= MAX_PLAYLISTS
                  return (
                    <li key={p.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                          checked ? 'border-[#ff4fa3] bg-[#ff4fa3]/10' : 'border-white/10 bg-white/5'
                        } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#ff4fa3]"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => togglePlaylist(p.id)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-2 text-sm text-[#94a3b8]">
                            {p.tracks.length} track{p.tracks.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="flex justify-end">
              <button
                onClick={goToTrackSelection}
                disabled={selectedPlaylistIds.length !== MAX_PLAYLISTS}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
              >
                Choose tracks
              </button>
            </div>
          </section>
        )}

        {phase === 'pick-tracks' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Choose five tracks per playlist</h2>
              <button onClick={() => setPhase('pick-playlists')} className="text-sm text-[#94a3b8] hover:text-white">
                Back
              </button>
            </div>

            {selectedPlaylistIds.map((pid) => {
              const pl = playlists.find((p) => p.id === pid)!
              const pe = edits[pid]
              const count = tracksSelectedCount(pid)
              return (
                <div key={pid} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <label className="block text-sm font-medium text-[#94a3b8]">
                    Public playlist name
                    <input
                      value={pe?.name ?? ''}
                      onChange={(e) => setPlaylistName(pid, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </label>
                  <p className={`mt-3 text-sm ${count === TRACKS_PER_PLAYLIST ? 'text-green-400' : 'text-[#94a3b8]'}`}>
                    {count}/{TRACKS_PER_PLAYLIST} selected
                  </p>
                  <ul className="mt-2 space-y-2">
                    {pl.tracks.map((t) => {
                      const te = pe?.tracks[t.id]
                      if (!te) return null
                      const disabled = !te.selected && count >= TRACKS_PER_PLAYLIST
                      const key = `${pid}:${t.id}`
                      return (
                        <li
                          key={t.id}
                          className={`rounded-lg border p-3 ${
                            te.selected ? 'border-[#ff4fa3]/60 bg-[#ff4fa3]/5' : 'border-white/10'
                          } ${disabled ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#ff4fa3]"
                              checked={te.selected}
                              disabled={disabled}
                              onChange={() => toggleTrack(pid, t.id)}
                              aria-label={`Select ${t.title}`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePreview(key, t.storage_path)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                              aria-label={previewingKey === key ? `Stop preview of ${t.title}` : `Preview ${t.title}`}
                            >
                              {previewLoadingKey === key ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : previewingKey === key ? (
                                <Pause className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Play className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                            <span className="flex-1 truncate text-sm" title={t.title}>
                              {t.title}
                            </span>
                          </div>
                          {te.selected && (
                            <label className="mt-2 block text-xs text-[#94a3b8]">
                              Public track name
                              <input
                                value={te.name}
                                onChange={(e) => setTrackName(pid, t.id, e.target.value)}
                                className="mt-1 w-full rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                              />
                            </label>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  stopPreview()
                  setError(null)
                  setPhase('review')
                }}
                disabled={!allValid}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
              >
                Review &amp; publish
              </button>
            </div>
          </section>
        )}

        {phase === 'review' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Final confirmation</h2>
              <button onClick={() => setPhase('pick-tracks')} className="text-sm text-[#94a3b8] hover:text-white">
                Back
              </button>
            </div>
            <p className="text-sm text-[#94a3b8]">
              This will publish the following public names and audio. Your original playlists
              and files remain unchanged.
            </p>
            {reviewModel.map((p, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{p.name}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#cbd5e1]">
                  {p.tracks.map((t, j) => (
                    <li key={j}>{t.name}</li>
                  ))}
                </ol>
              </div>
            ))}
            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#ff4fa3]"
                checked={confirmPermission}
                onChange={(e) => setConfirmPermission(e.target.checked)}
              />
              <span>
                I confirm I have permission to publish these playlist names, track names and
                audio files publicly.
              </span>
            </label>
            <button
              onClick={publish}
              disabled={!confirmPermission}
              className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Publish demo snapshot
            </button>
          </section>
        )}

        {phase === 'publishing' && (
          <p className="flex items-center gap-2 text-[#94a3b8]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Publishing snapshot…
          </p>
        )}

        {phase === 'done' && (
          <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-green-300">
              <Check className="h-5 w-5" aria-hidden="true" /> Demo published
            </h2>
            <p className="mt-2 text-[#cbd5e1]">
              The public interactive demo is now live on{' '}
              <Link href="/features#interactive-demo" className="underline">
                The Player page
              </Link>
              .
            </p>
            <button
              onClick={() => setPhase('overview')}
              className="mt-4 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Back to overview
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
