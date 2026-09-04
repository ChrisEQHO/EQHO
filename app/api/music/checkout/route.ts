import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getTrackById } from "@/lib/music/seed/tracks"
import { getCreatorById } from "@/lib/music/seed/creators"
import { PERSONAL_LICENCE } from "@/lib/music/seed/licence-tiers"
import { resolveMusicSubscriber } from "@/lib/music/subscriber"
import { quoteBasket } from "@/lib/music/pricing"
import type { BasketLine } from "@/lib/music/types"

// EQHO Music basket checkout.
//
// SECURITY: the browser sends only { trackId, tierId } pairs. Every amount is
// recomputed here from the seed catalogue and the caller's VERIFIED subscriber
// status via quoteBasket — the client can never influence what it is charged.
// The total is passed to Stripe inline through price_data so it cannot be
// tampered with, and an idempotency key derived from the (validated) basket +
// total prevents a retry from creating a second charge.
//
// PHASE 1: this is intentionally gated OFF. There are no live Stripe products,
// no master files, and no music purchase table yet (see docs). The route
// validates + prices the basket end-to-end so the flow is real and testable,
// but returns 503 instead of creating a live Checkout Session. Flipping
// MUSIC_CHECKOUT_ENABLED to "true" (Phase 2, after infra is approved) turns on
// the real session creation below with zero other changes.
export const dynamic = "force-dynamic"

const CHECKOUT_ENABLED = process.env.MUSIC_CHECKOUT_ENABLED === "true"

export async function POST(request: NextRequest) {
  try {
    const { isVerifiedSubscriber } = await resolveMusicSubscriber(request)

    // Trust only the { trackId, tierId } pairs; validate each against catalogue.
    let rawLines: unknown = []
    try {
      const body = await request.json()
      rawLines = Array.isArray(body?.lines) ? body.lines : []
    } catch {
      rawLines = []
    }

    const lines: BasketLine[] = []
    const seen = new Set<string>()
    for (const entry of rawLines as Array<Record<string, unknown>>) {
      const trackId = typeof entry?.trackId === "string" ? entry.trackId : ""
      if (!trackId || seen.has(trackId)) continue
      const track = getTrackById(trackId)
      if (!track) continue
      // De-dupe: one Personal Licence per track per basket.
      seen.add(trackId)
      lines.push({ trackId })
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: "Your basket is empty or contains no valid licences." }, { status: 400 })
    }

    // Server-authoritative total.
    const quote = quoteBasket(lines, isVerifiedSubscriber)
    if (quote.totalPence <= 0) {
      return NextResponse.json({ error: "Could not price this basket." }, { status: 409 })
    }

    // PHASE 1 GATE: prove the flow without charging. This is the deliberate
    // "no live payments yet" stop — never a bug.
    if (!CHECKOUT_ENABLED) {
      return NextResponse.json(
        {
          ok: false,
          phase: "preview",
          message:
            "EQHO Music is in private preview — licence checkout is not live yet. Your basket was priced correctly on the server.",
          quote,
        },
        { status: 503 },
      )
    }

    // ----- Phase 2 (inert until MUSIC_CHECKOUT_ENABLED=true) -----
    const origin = request.headers.get("origin") || "https://www.eqho-player.com"
    const line_items = lines.map((line) => {
      const track = getTrackById(line.trackId)!
      const creator = getCreatorById(track.creatorId)
      const { pricePence } = quote.lines.find((l) => l.trackId === line.trackId)!
      return {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: pricePence,
          product_data: {
            name: `${track.title} — ${PERSONAL_LICENCE.name}`,
            description: creator ? `by ${creator.name}` : undefined,
          },
        },
      }
    })

    const basketFingerprint = lines
      .map((l) => l.trackId)
      .sort()
      .join("|")

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items,
        metadata: {
          kind: "music_licence_purchase",
          basket: basketFingerprint,
          total_pence: String(quote.totalPence),
          subscriber_discount: quote.subscriberDiscountApplied ? "true" : "false",
        },
        payment_intent_data: {
          metadata: { kind: "music_licence_purchase", basket: basketFingerprint },
        },
        success_url: `${origin}/music/basket?purchased=1`,
        cancel_url: `${origin}/music/basket?canceled=1`,
      },
      { idempotencyKey: `music_${basketFingerprint}_${quote.totalPence}_${isVerifiedSubscriber ? "sub" : "std"}` },
    )

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0][music] checkout error:", detail)
    return NextResponse.json({ error: `Could not start checkout: ${detail}` }, { status: 500 })
  }
}
