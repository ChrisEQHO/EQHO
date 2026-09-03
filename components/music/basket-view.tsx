"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Trash2, ShoppingBasket, Loader2, Info } from "lucide-react"
import { useMusicStore } from "./music-store"
import { getTrackById } from "@/lib/music/seed/tracks"
import { getCreatorById } from "@/lib/music/seed/creators"
import { formatGBP } from "@/lib/music/pricing"
import type { PriceQuote } from "@/lib/music/types"
import { ArtworkPlaceholder } from "./artwork-placeholder"

export function BasketView() {
  const { lines, removeFromBasket, clearBasket } = useMusicStore()
  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [checkoutState, setCheckoutState] = useState<{ status: "idle" | "working" | "preview" | "error"; message?: string }>({
    status: "idle",
  })

  // Always re-price on the server whenever the basket changes. The client never
  // computes the authoritative total itself.
  const refreshQuote = useCallback(async () => {
    if (lines.length === 0) {
      setQuote(null)
      return
    }
    setLoadingQuote(true)
    try {
      const res = await fetch("/api/music/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines }),
      })
      const data = await res.json()
      setQuote(data)
      setIsSubscriber(Boolean(data.isSubscriber))
    } catch {
      setQuote(null)
    } finally {
      setLoadingQuote(false)
    }
  }, [lines])

  useEffect(() => {
    refreshQuote()
  }, [refreshQuote])

  const checkout = async () => {
    setCheckoutState({ status: "working" })
    try {
      const res = await fetch("/api/music/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines }),
      })
      const data = await res.json()
      if (data.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      if (res.status === 503 && data.phase === "preview") {
        setCheckoutState({ status: "preview", message: data.message })
        return
      }
      setCheckoutState({ status: "error", message: data.error ?? "Checkout failed." })
    } catch {
      setCheckoutState({ status: "error", message: "Checkout failed. Please try again." })
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-20 text-center">
        <ShoppingBasket className="h-10 w-10 text-white/30" />
        <div>
          <p className="text-base font-medium text-white">Your basket is empty</p>
          <p className="mt-1 text-sm text-white/50">Add a licence from any track to get started.</p>
        </div>
        <Link
          href="/music/browse"
          className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#ff4fa3]/25 transition-transform hover:scale-[1.03]"
        >
          Browse the catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Line items */}
      <div className="flex flex-col gap-3">
        {lines.map((line) => {
          const track = getTrackById(line.trackId)
          if (!track) return null
          const creator = getCreatorById(track.creatorId)
          return (
            <div
              key={line.trackId}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <ArtworkPlaceholder seed={track.id} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{track.title}</p>
                <p className="truncate text-xs text-white/50">{creator?.name}</p>
                <p className="mt-1 text-xs text-white/60">Personal Licence</p>
              </div>
              <button
                type="button"
                onClick={() => removeFromBasket(line.trackId)}
                aria-label={`Remove ${track.title} from basket`}
                className="shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
        <button
          type="button"
          onClick={clearBasket}
          className="mt-1 self-start text-xs text-white/40 hover:text-white/70"
        >
          Clear basket
        </button>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-semibold text-white">Order summary</h2>

          <div className="flex flex-col gap-2 text-sm" aria-live="polite">
            {loadingQuote && !quote ? (
              <span className="flex items-center gap-2 text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" /> Pricing…
              </span>
            ) : quote ? (
              <>
                <Row label="Subtotal" value={formatGBP(quote.subtotalPence)} />
                {quote.subscriberDiscountApplied && (
                  <Row
                    label="Subscriber discount (10%)"
                    value={`−${formatGBP(quote.discountPence)}`}
                    accent
                  />
                )}
                <div className="my-1 border-t border-white/10" />
                <Row label="Total" value={formatGBP(quote.totalPence)} bold />
              </>
            ) : (
              <span className="text-white/50">Unable to price basket.</span>
            )}
          </div>

          {!isSubscriber && (
            <p className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2.5 text-xs text-white/50">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff4fa3]" />
              EQHO subscribers save 10% on every licence.
            </p>
          )}

          {checkoutState.status === "preview" && (
            <p className="rounded-lg border border-[#ff4fa3]/30 bg-[#ff4fa3]/10 p-2.5 text-xs text-white/75">
              {checkoutState.message}
            </p>
          )}
          {checkoutState.status === "error" && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-200/90">
              {checkoutState.message}
            </p>
          )}

          <button
            type="button"
            onClick={checkout}
            disabled={checkoutState.status === "working" || !quote}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#ff4fa3]/25 transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
          >
            {checkoutState.status === "working" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting…
              </>
            ) : (
              "Checkout"
            )}
          </button>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? "text-[#ff4fa3]" : "text-white/60"}>{label}</span>
      <span className={bold ? "text-base font-semibold text-white" : accent ? "text-[#ff4fa3]" : "text-white/80"}>
        {value}
      </span>
    </div>
  )
}
