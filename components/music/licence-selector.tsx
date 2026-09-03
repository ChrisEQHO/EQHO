"use client"

import { useState } from "react"
import { Check, Lock, ShoppingBasket } from "lucide-react"
import { useMusicStore } from "./music-store"
import { LICENCE_TIER_ORDER, getLicenceTier } from "@/lib/music/seed/licence-tiers"
import { formatGBP, SUBSCRIBER_DISCOUNT_RATE } from "@/lib/music/pricing"
import type { LicenceTierId } from "@/lib/music/types"

// Licence tier picker + add-to-basket for a single track. Prices shown here are
// display-only; the checkout route recomputes the authoritative total. When the
// viewer is a verified subscriber we preview the 10% discount, but the server
// remains the source of truth (spec §27/§29).
export function LicenceSelector({
  trackId,
  availableTiers,
  isSubscriber,
}: {
  trackId: string
  availableTiers: LicenceTierId[]
  isSubscriber: boolean
}) {
  const offered = LICENCE_TIER_ORDER.filter((id) => availableTiers.includes(id))
  const [selected, setSelected] = useState<LicenceTierId>(offered[0])
  const { addToBasket, isInBasket } = useMusicStore()
  const inBasket = isInBasket(trackId)

  const tier = getLicenceTier(selected)
  const discounted = isSubscriber ? Math.round(tier.pricePence * (1 - SUBSCRIBER_DISCOUNT_RATE)) : tier.pricePence

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Choose a licence</h2>
        {isSubscriber && (
          <span className="rounded-full bg-[var(--eqho-purple)]/15 px-2.5 py-0.5 text-[11px] font-medium text-[var(--eqho-purple)]">
            Subscriber −10%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Licence tier">
        {offered.map((id) => {
          const t = getLicenceTier(id)
          const active = id === selected
          const price = isSubscriber ? Math.round(t.pricePence * (1 - SUBSCRIBER_DISCOUNT_RATE)) : t.pricePence
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(id)}
              className={
                "flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors " +
                (active
                  ? "border-[var(--eqho-purple)] bg-[var(--eqho-purple)]/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25")
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {t.exclusive && <Lock className="h-3.5 w-3.5 text-[var(--eqho-purple)]" />}
                  {t.name}
                </span>
                <span className="text-xs text-white/55">{t.tagline}</span>
              </span>
              <span className="shrink-0 text-right">
                {isSubscriber && (
                  <span className="block text-[11px] text-white/40 line-through">{formatGBP(t.pricePence)}</span>
                )}
                <span className="text-sm font-semibold text-white">{formatGBP(price)}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Rights of the selected tier */}
      <ul className="flex flex-col gap-1.5 rounded-lg bg-white/[0.02] p-3">
        {tier.rights.map((right) => (
          <li key={right} className="flex items-start gap-2 text-xs text-white/65">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--eqho-purple)]" />
            {right}
          </li>
        ))}
      </ul>

      {tier.exclusive && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-2.5 text-xs text-amber-200/90">
          Buying the exclusive licence permanently removes this track from the marketplace for everyone else.
        </p>
      )}

      <button
        type="button"
        onClick={() => addToBasket(trackId, selected)}
        disabled={inBasket}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[var(--eqho-purple)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--eqho-purple)]/85 disabled:opacity-60"
      >
        <ShoppingBasket className="h-4 w-4" />
        {inBasket ? "In your basket" : `Add licence — ${formatGBP(discounted)}`}
      </button>
    </div>
  )
}
