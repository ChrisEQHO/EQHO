'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Lazy loader for the interactive demo.
 *
 * Performance: the demo bundle is code-split (next/dynamic, ssr:false) AND only
 * mounted once it approaches the viewport (IntersectionObserver). Audio is never
 * preloaded (the player uses preload="none"), and this component only exists on
 * The Player page, so no demo JS is added to the homepage or other routes. A
 * reserved min-height prevents layout shift while the demo mounts.
 */

const InteractiveDemo = dynamic(
  () => import('./interactive-demo').then((m) => m.InteractiveDemo),
  {
    ssr: false,
    loading: () => <ReservedBox />,
  },
)

function ReservedBox() {
  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a0f1e]">
      <p className="flex items-center gap-2 text-[#94a3b8]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading the demo…
      </p>
    </div>
  )
}

export function InteractiveDemoLazy() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="min-h-[480px]">
      {inView ? <InteractiveDemo /> : <ReservedBox />}
    </div>
  )
}
