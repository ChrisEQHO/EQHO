'use client'

import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { isV0Preview } from '@/lib/utils/preview'

/**
 * Phase Two interactive demo lives at this location. Until it ships we render a
 * clearly labelled INTERNAL development placeholder — and only in preview/dev.
 *
 * On the production website `isV0Preview` is false, so this renders nothing and
 * the unfinished demo is never exposed to real visitors. The `#interactive-demo`
 * anchor that wraps this component still exists in the DOM on every environment,
 * so links to it resolve; only the placeholder body is gated.
 *
 * Revealed after mount to avoid a hydration mismatch (SSR and first paint always
 * render the production/no-placeholder variant).
 */
export function InteractiveDemoPlaceholder() {
  const [show, setShow] = useState(false)
  useEffect(() => setShow(isV0Preview), [])
  if (!show) return null

  return (
    <div className="rounded-3xl border border-dashed border-[#ff8a00]/40 bg-[rgba(9,15,28,0.9)] p-8 text-center sm:p-12">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
        <Wrench className="h-6 w-6 text-[#ff8a00]" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#ffb673]">
        Internal · development only
      </p>
      <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Interactive EQHO Player demo coming in Phase Two.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-[#94a3b8]">
        This placeholder is only visible in development and preview. It stays hidden on the public
        website until the interactive demo is ready.
      </p>
    </div>
  )
}
