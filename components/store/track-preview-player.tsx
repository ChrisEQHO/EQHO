'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { formatDuration } from '@/lib/store/format'

/**
 * Compact play/pause + scrub bar for a track's watermarked PREVIEW. Streams from
 * the open preview endpoint (`/api/store/audio?type=preview`). No entitlement is
 * required — previews are public. The clean master is never exposed here.
 */
export function TrackPreviewPlayer({
  slug,
  durationSeconds,
  className = '',
}: {
  slug: string
  durationSeconds?: number
  className?: string
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(durationSeconds ?? 0)
  const [error, setError] = useState(false)

  const previewSrc = `/api/store/audio?slug=${encodeURIComponent(slug)}&type=preview`

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || durationSeconds || 0)
    const onEnd = () => {
      setPlaying(false)
      setCurrent(0)
    }
    const onPlaying = () => setLoading(false)
    const onWaiting = () => setLoading(true)
    const onError = () => {
      setError(true)
      setLoading(false)
      setPlaying(false)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('error', onError)
    }
  }, [durationSeconds])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    setError(false)
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      setLoading(true)
      await audio.play()
      setPlaying(true)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const next = Number(e.target.value)
    audio.currentTime = next
    setCurrent(next)
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} src={previewSrc} preload="none" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause preview' : 'Play preview'}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00]/70"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : playing ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={onScrub}
            aria-label="Preview position"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#ff4fa3]"
            style={{
              background: `linear-gradient(to right, #ff6aa8 ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[#8b96ac]">
          <span className="tabular-nums">{formatDuration(current)}</span>
          {error ? (
            <span className="text-[#ff8a8a]">Preview unavailable</span>
          ) : (
            <span className="uppercase tracking-wide">Watermarked preview</span>
          )}
          <span className="tabular-nums">{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  )
}
