'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Music,
} from 'lucide-react'

/**
 * PUBLIC interactive demo player.
 *
 * State isolation: everything here is browser-only and ephemeral. It reads the
 * published snapshot from the PUBLIC /api/demo endpoint and streams audio from
 * /api/demo?action=audio. It NEVER calls authenticated APIs, never writes to
 * Supabase, never uploads to cloud, never starts Stripe, and resets on refresh.
 * It intentionally does not import any production player/cloud logic.
 */

interface DemoTrack {
  id: string
  name: string
  durationSeconds: number
}
interface DemoPlaylist {
  id: string
  name: string
  tracks: DemoTrack[]
}
interface DemoData {
  enabled: boolean
  playlists: DemoPlaylist[]
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error'
type PlaybackPhase = 'idle' | 'playing' | 'paused' | 'gap'

const DEFAULTS = {
  volume: 0.8,
  gapSeconds: 5,
  repeats: 1,
  backToBack: false,
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function InteractiveDemo() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [data, setData] = useState<DemoData | null>(null)

  // ---- Session (visitor) state — all ephemeral -------------------------
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)
  const [sessionOrder, setSessionOrder] = useState<DemoTrack[]>([])
  const [sessionPlaylistName, setSessionPlaylistName] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<PlaybackPhase>('idle')
  const [volume, setVolume] = useState(DEFAULTS.volume)
  const [gapSeconds, setGapSeconds] = useState(DEFAULTS.gapSeconds)
  const [repeats, setRepeats] = useState(DEFAULTS.repeats)
  const [backToBack, setBackToBack] = useState(DEFAULTS.backToBack)
  const [countdown, setCountdown] = useState(0)
  const [repeatsLeft, setRepeatsLeft] = useState(DEFAULTS.repeats)
  const [fullscreen, setFullscreen] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)

  // ---- Refs --------------------------------------------------------------
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gapTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guards against overlap when the visitor clicks rapidly: every playback
  // start bumps the token; stale async callbacks check it and bail.
  const playTokenRef = useRef(0)

  // ---- Load the published snapshot --------------------------------------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/demo', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setLoadState('error')
          return
        }
        const json = (await res.json()) as DemoData
        if (cancelled) return
        if (!json.enabled || json.playlists.length === 0) {
          setLoadState('unavailable')
          return
        }
        setData(json)
        setLoadState('ready')
      } catch {
        if (!cancelled) setLoadState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ---- Audio element setup + teardown -----------------------------------
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'none' // never preload the demo files up front
    audioRef.current = audio
    return () => {
      // Stop audio when leaving the page / unmounting.
      audio.pause()
      audio.src = ''
      if (gapTimerRef.current) clearInterval(gapTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const clearGapTimer = useCallback(() => {
    if (gapTimerRef.current) {
      clearInterval(gapTimerRef.current)
      gapTimerRef.current = null
    }
    setCountdown(0)
  }, [])

  const stopAudio = useCallback(() => {
    playTokenRef.current++
    clearGapTimer()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.onended = null
    }
    setAudioLoading(false)
  }, [clearGapTimer])

  // ---- Core: play a given index -----------------------------------------
  const playIndex = useCallback(
    async (index: number, order: DemoTrack[] = sessionOrder) => {
      const audio = audioRef.current
      if (!audio || order.length === 0) return
      const clamped = ((index % order.length) + order.length) % order.length
      const track = order[clamped]

      const token = ++playTokenRef.current
      clearGapTimer()
      setTrackError(null)
      setCurrentIndex(clamped)

      // Stop whatever is playing before starting the next (no overlap).
      audio.pause()
      audio.src = `/api/demo?action=audio&track=${encodeURIComponent(track.id)}`
      audio.volume = volume
      setAudioLoading(true)

      try {
        await audio.play()
        if (token !== playTokenRef.current) {
          // A newer action superseded this one — abandon.
          audio.pause()
          return
        }
        setPhase('playing')
      } catch {
        if (token !== playTokenRef.current) return
        // A single track failing must not stop the session.
        setTrackError(`"${track.name}" could not be played. Try another routine.`)
        setPhase('paused')
      } finally {
        if (token === playTokenRef.current) setAudioLoading(false)
      }
    },
    [sessionOrder, volume, clearGapTimer],
  )

  // ---- Advance logic (runs on track end) --------------------------------
  const advance = useCallback(() => {
    const order = sessionOrder
    if (order.length === 0) return
    const atEnd = currentIndex >= order.length - 1

    const goNext = (nextIndex: number) => {
      if (backToBack || gapSeconds <= 0) {
        void playIndex(nextIndex)
        return
      }
      // Gap countdown, then play.
      setPhase('gap')
      setCountdown(gapSeconds)
      const token = playTokenRef.current
      let remaining = gapSeconds
      gapTimerRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) {
          clearGapTimer()
          if (token === playTokenRef.current) void playIndex(nextIndex)
        }
      }, 1000)
    }

    if (!atEnd) {
      goNext(currentIndex + 1)
    } else if (repeatsLeft > 1) {
      setRepeatsLeft((r) => r - 1)
      goNext(0)
    } else {
      // End of session.
      setPhase('idle')
      clearGapTimer()
    }
  }, [sessionOrder, currentIndex, backToBack, gapSeconds, repeatsLeft, playIndex, clearGapTimer])

  // Keep the audio 'ended' handler pointed at the latest advance().
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.onended = () => advance()
    return () => {
      if (audio) audio.onended = null
    }
  }, [advance])

  // ---- Session actions ---------------------------------------------------
  const loadPlaylist = useCallback(
    (playlistId: string) => {
      const pl = data?.playlists.find((p) => p.id === playlistId)
      if (!pl) return
      stopAudio()
      setActivePlaylistId(playlistId)
      setSessionOrder([...pl.tracks])
      setSessionPlaylistName(pl.name)
      setCurrentIndex(0)
      setRepeatsLeft(repeats)
      setPhase('idle')
      setTrackError(null)
    },
    [data, repeats, stopAudio],
  )

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || sessionOrder.length === 0) return
    if (phase === 'playing') {
      audio.pause()
      setPhase('paused')
      return
    }
    if (phase === 'gap') {
      // Skip the gap and play now.
      clearGapTimer()
      void playIndex(currentIndex + 1 <= sessionOrder.length - 1 ? currentIndex + 1 : 0)
      return
    }
    if (phase === 'paused' && audio.src && audio.currentTime > 0) {
      void audio.play().then(() => setPhase('playing')).catch(() => {
        setTrackError('Playback needs another tap in this browser.')
      })
      return
    }
    void playIndex(currentIndex)
  }, [phase, sessionOrder.length, currentIndex, playIndex, clearGapTimer])

  const next = useCallback(() => {
    if (sessionOrder.length === 0) return
    void playIndex(currentIndex + 1)
  }, [sessionOrder.length, currentIndex, playIndex])

  const prev = useCallback(() => {
    if (sessionOrder.length === 0) return
    void playIndex(currentIndex - 1)
  }, [sessionOrder.length, currentIndex, playIndex])

  const selectRoutine = useCallback(
    (index: number) => {
      void playIndex(index)
    },
    [playIndex],
  )

  const moveTrack = useCallback(
    (index: number, dir: -1 | 1) => {
      setSessionOrder((prev) => {
        const target = index + dir
        if (target < 0 || target >= prev.length) return prev
        const copy = [...prev]
        ;[copy[index], copy[target]] = [copy[target], copy[index]]
        return copy
      })
      // Keep the pointer on the same routine the visitor is looking at.
      setCurrentIndex((ci) => {
        if (ci === index) return index + dir
        if (ci === index + dir) return index
        return ci
      })
    },
    [],
  )

  const resetDemo = useCallback(() => {
    stopAudio()
    setVolume(DEFAULTS.volume)
    setGapSeconds(DEFAULTS.gapSeconds)
    setRepeats(DEFAULTS.repeats)
    setRepeatsLeft(DEFAULTS.repeats)
    setBackToBack(DEFAULTS.backToBack)
    setCountdown(0)
    setFullscreen(false)
    setTrackError(null)
    // Restore the default (first) playlist and its published order.
    const first = data?.playlists[0]
    if (first) {
      setActivePlaylistId(first.id)
      setSessionOrder([...first.tracks])
      setSessionPlaylistName(first.name)
    }
    setCurrentIndex(0)
    setPhase('idle')
  }, [data, stopAudio])

  // Initialise the default playlist once data arrives.
  useEffect(() => {
    if (data && data.playlists[0] && !activePlaylistId) {
      const first = data.playlists[0]
      setActivePlaylistId(first.id)
      setSessionOrder([...first.tracks])
      setSessionPlaylistName(first.name)
    }
  }, [data, activePlaylistId])

  // Keep repeatsLeft in sync when the visitor changes the repeats setting while idle.
  useEffect(() => {
    if (phase === 'idle') setRepeatsLeft(repeats)
  }, [repeats, phase])

  // Esc exits fullscreen.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  // ---- Derived -----------------------------------------------------------
  const currentTrack = sessionOrder[currentIndex] ?? null
  const nextTrack =
    sessionOrder.length > 0 ? sessionOrder[(currentIndex + 1) % sessionOrder.length] : null

  const approxSessionSeconds = useMemo(() => {
    const trackTotal = sessionOrder.reduce((sum, t) => sum + (t.durationSeconds || 0), 0)
    const gaps = backToBack ? 0 : Math.max(0, sessionOrder.length - 1) * gapSeconds
    return (trackTotal + gaps) * Math.max(1, repeats)
  }, [sessionOrder, gapSeconds, backToBack, repeats])

  // =======================================================================
  // Render states
  // =======================================================================
  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a0f1e]">
        <p className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading the demo…
        </p>
      </div>
    )
  }

  if (loadState === 'unavailable' || loadState === 'error') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0a0f1e] p-8 text-center">
        <Music className="h-8 w-8 text-[#94a3b8]" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-white">The interactive demo is currently unavailable</h3>
        <p className="mt-2 max-w-md text-pretty text-[#94a3b8]">
          It looks like the demo is not available right now. You can still create a free account
          to explore the full EQHO Player.
        </p>
      </div>
    )
  }

  // Shared control panel (used in both inline and fullscreen views).
  const controls = (
    <DemoControls
      phase={phase}
      audioLoading={audioLoading}
      onTogglePlay={togglePlay}
      onNext={next}
      onPrev={prev}
      volume={volume}
      setVolume={setVolume}
      gapSeconds={gapSeconds}
      setGapSeconds={setGapSeconds}
      repeats={repeats}
      setRepeats={setRepeats}
      backToBack={backToBack}
      setBackToBack={setBackToBack}
      disabled={sessionOrder.length === 0}
    />
  )

  const nowPlaying = (
    <div aria-live="polite" className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#ff8a00]">
        {phase === 'gap' ? `Next routine in ${countdown}s` : 'Current routine'}
      </p>
      <p className="text-2xl font-bold text-white">{currentTrack?.name ?? '—'}</p>
      <p className="text-sm text-[#94a3b8]">
        Next: {nextTrack?.name ?? '—'}
      </p>
    </div>
  )

  const sessionMeta = (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#94a3b8]">
      <span>
        Routine {sessionOrder.length ? currentIndex + 1 : 0} of {sessionOrder.length}
      </span>
      <span>Approx. session {fmt(approxSessionSeconds)}</span>
      {repeats > 1 && <span>Repeat {Math.max(1, repeats - repeatsLeft + 1)} of {repeats}</span>}
    </div>
  )

  // ----- Fullscreen coaching view ----------------------------------------
  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-[#020617] p-[max(1.5rem,env(safe-area-inset-top))_max(1.5rem,env(safe-area-inset-right))_max(1.5rem,env(safe-area-inset-bottom))_max(1.5rem,env(safe-area-inset-left))]"
        role="region"
        aria-label="Coaching view"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#94a3b8]">{sessionPlaylistName}</span>
          <button
            onClick={() => setFullscreen(false)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3]"
          >
            <Minimize2 className="h-4 w-4" aria-hidden="true" /> Exit
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#ff8a00]">
            {phase === 'gap' ? 'Next routine in' : 'Current routine'}
          </p>
          {phase === 'gap' ? (
            <p className="mt-2 text-7xl font-black tabular-nums text-white">{countdown}</p>
          ) : (
            <p className="mt-2 text-balance text-4xl font-black text-white sm:text-6xl">
              {currentTrack?.name ?? '—'}
            </p>
          )}
          <p className="mt-4 text-lg text-[#94a3b8]">Next: {nextTrack?.name ?? '—'}</p>
          <p className="mt-1 text-sm text-[#64748b]">
            Routine {currentIndex + 1} of {sessionOrder.length}
          </p>
        </div>
        <div className="mx-auto w-full max-w-xl">{controls}</div>
      </div>
    )
  }

  // ----- Inline view ------------------------------------------------------
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e]">
      <div className="border-b border-white/5 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a playlist">
            {data?.playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPlaylist(p.id)}
                aria-pressed={activePlaylistId === p.id}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] ${
                  activePlaylistId === p.id
                    ? 'bg-white text-black'
                    : 'border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFullscreen(true)}
              disabled={sessionOrder.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] disabled:opacity-40"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" /> Coaching view
            </button>
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset demo
            </button>
          </div>
        </div>
        {nowPlaying}
        <div className="mt-3">{sessionMeta}</div>
        {trackError && (
          <p role="alert" className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-sm text-amber-200">
            {trackError}
          </p>
        )}
      </div>

      {/* Running order */}
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <ol className="divide-y divide-white/5">
          {sessionOrder.map((t, i) => (
            <li
              key={t.id}
              className={`flex items-center gap-3 p-3 sm:px-6 ${
                i === currentIndex ? 'bg-[#ff4fa3]/10' : ''
              }`}
            >
              <span className="w-6 text-center text-sm font-bold text-[#ff8a00]">{i + 1}</span>
              <button
                onClick={() => selectRoutine(i)}
                className="flex-1 text-left text-sm font-medium text-white hover:text-[#ff8a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] rounded"
              >
                {t.name}
              </button>
              <span className="text-xs tabular-nums text-[#94a3b8]">{fmt(t.durationSeconds)}</span>
              <span className="flex flex-col">
                <button
                  onClick={() => moveTrack(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${t.name} up`}
                  className="text-[#94a3b8] hover:text-white disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] rounded"
                >
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => moveTrack(i, 1)}
                  disabled={i === sessionOrder.length - 1}
                  aria-label={`Move ${t.name} down`}
                  className="text-[#94a3b8] hover:text-white disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] rounded"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ol>

        <div className="border-t border-white/5 p-4 sm:p-6 lg:border-l lg:border-t-0">
          {controls}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Controls sub-component (shared between inline + fullscreen).
// ---------------------------------------------------------------------------
function DemoControls(props: {
  phase: PlaybackPhase
  audioLoading: boolean
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  volume: number
  setVolume: (v: number) => void
  gapSeconds: number
  setGapSeconds: (v: number) => void
  repeats: number
  setRepeats: (v: number) => void
  backToBack: boolean
  setBackToBack: (v: boolean) => void
  disabled: boolean
}) {
  const {
    phase,
    audioLoading,
    onTogglePlay,
    onNext,
    onPrev,
    volume,
    setVolume,
    gapSeconds,
    setGapSeconds,
    repeats,
    setRepeats,
    backToBack,
    setBackToBack,
    disabled,
  } = props
  const isPlaying = phase === 'playing'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPrev}
          disabled={disabled}
          aria-label="Previous routine"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] disabled:opacity-40"
        >
          <SkipBack className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
        >
          {audioLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Play className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onNext}
          disabled={disabled}
          aria-label="Skip forward"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] disabled:opacity-40"
        >
          <SkipForward className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div>
        <label htmlFor="demo-volume" className="flex items-center gap-2 text-sm font-medium text-[#94a3b8]">
          <Volume2 className="h-4 w-4" aria-hidden="true" /> Volume
        </label>
        <input
          id="demo-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="mt-2 w-full accent-[#ff4fa3]"
        />
      </div>

      <div>
        <label htmlFor="demo-gap" className="block text-sm font-medium text-[#94a3b8]">
          Gap between routines: <span className="text-white">{gapSeconds}s</span>
        </label>
        <input
          id="demo-gap"
          type="range"
          min={0}
          max={30}
          step={1}
          value={gapSeconds}
          onChange={(e) => setGapSeconds(Number(e.target.value))}
          className="mt-2 w-full accent-[#ff4fa3]"
        />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="demo-repeats" className="text-sm font-medium text-[#94a3b8]">
          Playlist repeats
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRepeats(Math.max(1, repeats - 1))}
            aria-label="Decrease repeats"
            className="h-8 w-8 rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3]"
          >
            −
          </button>
          <span id="demo-repeats" className="w-8 text-center text-white tabular-nums">
            {repeats}x
          </span>
          <button
            onClick={() => setRepeats(Math.min(10, repeats + 1))}
            aria-label="Increase repeats"
            className="h-8 w-8 rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3]"
          >
            +
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between text-sm font-medium text-[#94a3b8]">
        Back-to-back playback
        <button
          role="switch"
          aria-checked={backToBack}
          aria-label="Back-to-back playback"
          onClick={() => setBackToBack(!backToBack)}
          className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3] ${
            backToBack ? 'bg-[#ff4fa3]' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              backToBack ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </label>
    </div>
  )
}
