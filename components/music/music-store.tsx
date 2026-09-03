"use client"

// EQHO Music — client store.
//
// A single provider holds the two pieces of ephemeral client state the
// marketplace UI needs:
//   • the basket (track + chosen licence tier), and
//   • the currently-previewing track for the persistent player bar.
//
// The basket is intentionally CLIENT-ONLY cart state. It is mirrored into
// sessionStorage purely so a mid-session reload doesn't lose the basket — it is
// NOT a data store. Every price the user is charged is recomputed server-side
// from the licence tiers (see lib/music/pricing.ts and /api/music/checkout), so
// nothing here is trusted for money.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { BasketLine } from "@/lib/music/types"

interface MusicStoreValue {
  // Basket
  lines: BasketLine[]
  addToBasket: (trackId: string) => void
  removeFromBasket: (trackId: string) => void
  clearBasket: () => void
  isInBasket: (trackId: string) => boolean
  basketCount: number

  // Preview player
  nowPlayingId: string | null
  isPlaying: boolean
  playTrack: (trackId: string, previewUrl: string) => void
  togglePlay: () => void
  stopPlayback: () => void
}

const MusicStoreContext = createContext<MusicStoreValue | null>(null)

const BASKET_STORAGE_KEY = "eqho-music-basket-v1"

export function MusicStoreProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Hydrate basket from sessionStorage once on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BASKET_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as BasketLine[]
        if (Array.isArray(parsed)) setLines(parsed)
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true)
  }, [])

  // Persist basket after hydration so we never clobber stored state on first paint.
  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage full / unavailable — non-fatal for a prototype basket */
    }
  }, [lines, hydrated])

  // Lazily create a single shared audio element for previews.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "none"
    audioRef.current = audio
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("ended", onEnded)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  const addToBasket = useCallback((trackId: string) => {
    setLines((prev) => {
      // Every track uses the one Personal Licence, so a basket line is just a
      // track reference and each track appears at most once.
      if (prev.some((l) => l.trackId === trackId)) return prev
      return [...prev, { trackId }]
    })
  }, [])

  const removeFromBasket = useCallback((trackId: string) => {
    setLines((prev) => prev.filter((l) => l.trackId !== trackId))
  }, [])

  const clearBasket = useCallback(() => setLines([]), [])

  const isInBasket = useCallback(
    (trackId: string) => lines.some((l) => l.trackId === trackId),
    [lines],
  )

  const playTrack = useCallback((trackId: string, previewUrl: string) => {
    const audio = audioRef.current
    if (!audio) return
    if (nowPlayingId === trackId) {
      // Toggle current
      if (audio.paused) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        audio.pause()
        setIsPlaying(false)
      }
      return
    }
    audio.src = previewUrl
    audio.currentTime = 0
    setNowPlayingId(trackId)
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }, [nowPlayingId])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !nowPlayingId) return
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [nowPlayingId])

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
    setNowPlayingId(null)
  }, [])

  const value = useMemo<MusicStoreValue>(
    () => ({
      lines,
      addToBasket,
      removeFromBasket,
      clearBasket,
      isInBasket,
      basketCount: lines.length,
      nowPlayingId,
      isPlaying,
      playTrack,
      togglePlay,
      stopPlayback,
    }),
    [
      lines,
      addToBasket,
      removeFromBasket,
      clearBasket,
      isInBasket,
      nowPlayingId,
      isPlaying,
      playTrack,
      togglePlay,
      stopPlayback,
    ],
  )

  return <MusicStoreContext.Provider value={value}>{children}</MusicStoreContext.Provider>
}

export function useMusicStore(): MusicStoreValue {
  const ctx = useContext(MusicStoreContext)
  if (!ctx) throw new Error("useMusicStore must be used within MusicStoreProvider")
  return ctx
}
