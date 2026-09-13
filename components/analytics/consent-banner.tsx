'use client'

/**
 * Minimal, on-brand analytics consent control.
 *
 * Only shown once (until a choice is made) and only where analytics is allowed
 * to run. Declining keeps product analytics anonymous and leaves session replay
 * fully OFF. Accepting enables consented, strictly-masked replay.
 *
 * This governs replay/enriched capture consent. Core anonymous, sanitized event
 * counts follow the same production/web gate as the existing Vercel Analytics.
 */

import { useEffect, useState } from "react"
import { analyticsAllowed, applyConsent } from "@/lib/analytics/posthog-client"
import { getConsent, setConsent } from "@/lib/analytics/consent"

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!analyticsAllowed()) return
    if (getConsent() === "unset") setVisible(true)
  }, [])

  if (!visible) return null

  function choose(value: "granted" | "denied") {
    setConsent(value)
    applyConsent()
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics preferences"
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1220]/95 p-4 text-sm text-white shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur md:flex md:items-center md:gap-4">
        <p className="text-pretty leading-relaxed text-white/80">
          We use privacy-first analytics to improve EQHO. Optional session
          diagnostics stay off unless you allow them, and all inputs and on-screen
          text are masked. No names, emails, or audio are ever recorded.
        </p>
        <div className="mt-3 flex shrink-0 gap-2 md:mt-0">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="inline-flex h-9 items-center justify-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.02]"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
