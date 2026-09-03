"use client"

import { Check, ShoppingBasket } from "lucide-react"
import { useMusicStore } from "./music-store"
import { PERSONAL_LICENCE } from "@/lib/music/seed/licence-tiers"
import { formatGBP, priceForLicence } from "@/lib/music/pricing"

// Purchase card for a single track. EQHO Music sells exactly ONE licence — the
// Personal Licence at a flat price — so there is no tier picker. Prices shown
// here are display-only; the checkout route recomputes the authoritative total.
// When the viewer is a verified subscriber we preview the 10% discount, but the
// server remains the source of truth (spec §27/§29).
export function LicenceSelector({
  trackId,
  isSubscriber,
}: {
  trackId: string
  isSubscriber: boolean
}) {
  const { addToBasket, isInBasket } = useMusicStore()
  const inBasket = isInBasket(trackId)
  const { basePence, discountPence, pricePence } = priceForLicence(isSubscriber)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{PERSONAL_LICENCE.name}</h2>
        {isSubscriber && (
          <span className="rounded-full bg-[#ff4fa3]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#ff8fc4]">
            Subscriber −10%
          </span>
        )}
      </div>

      <p className="text-sm text-white/55">{PERSONAL_LICENCE.tagline}</p>

      {/* Single flat price */}
      <div className="flex items-end gap-2">
        {discountPence > 0 && (
          <span className="pb-1 text-sm text-white/40 line-through">
            {formatGBP(basePence)}
          </span>
        )}
        <span className="bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-4xl font-semibold text-transparent">
          {formatGBP(pricePence)}
        </span>
        <span className="pb-1 text-xs text-white/45">one-off</span>
      </div>

      {/* What the Personal Licence includes */}
      <ul className="flex flex-col gap-1.5 rounded-lg bg-white/[0.02] p-3">
        {PERSONAL_LICENCE.rights.map((right) => (
          <li key={right} className="flex items-start gap-2 text-xs text-white/65">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff4fa3]" />
            {right}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => addToBasket(trackId)}
        disabled={inBasket}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-3 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(255,79,163,0.8)] transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        <ShoppingBasket className="h-4 w-4" />
        {inBasket ? "In your basket" : `Add licence — ${formatGBP(pricePence)}`}
      </button>
    </div>
  )
}
