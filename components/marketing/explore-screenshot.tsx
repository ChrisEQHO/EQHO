'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Maximize2 } from 'lucide-react'

type Props = {
  src: string
  alt: string
  /** Intrinsic pixel size of the screenshot — preserves the true aspect ratio. */
  width: number
  height: number
}

/**
 * A feature screenshot that opens into a larger, accessible lightbox.
 *
 * - The thumbnail is a real <button>, so it's keyboard-focusable with a visible
 *   ring and a full-size touch target.
 * - The enlarged view is a role="dialog" aria-modal overlay with a clear close
 *   button, closes on Escape and on backdrop click, locks body scroll, moves
 *   focus to the close button on open and restores it to the trigger on close.
 * - Images are lazy-loaded (every instance sits below the fold) and keep their
 *   intrinsic aspect ratio via width/height + h-auto w-full.
 */
export function ExploreScreenshot({ src, alt, width, height }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Return focus to the thumbnail that opened the dialog.
      trigger?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge screenshot: ${alt}`}
        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_30px_80px_-40px_rgba(255,79,163,0.35)] transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          sizes="(min-width: 1024px) 560px, 100vw"
          className="h-auto w-full"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close enlarged screenshot"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto max-h-[88vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
