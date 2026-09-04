import { NextRequest, NextResponse } from "next/server"
import { getTrackById } from "@/lib/music/seed/tracks"
import { resolveMusicSubscriber } from "@/lib/music/subscriber"
import { quoteBasket } from "@/lib/music/pricing"
import type { BasketLine } from "@/lib/music/types"

// Server-authoritative price quote for a basket. The client sends only
// { trackId, tierId } pairs; every amount is recomputed here from the seed
// catalogue and the caller's VERIFIED subscriber status. The browser can never
// influence the totals it is shown (or later charged).
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { isVerifiedSubscriber } = await resolveMusicSubscriber(request)

  let rawLines: unknown = []
  try {
    const body = await request.json()
    rawLines = Array.isArray(body?.lines) ? body.lines : []
  } catch {
    rawLines = []
  }

  // Validate + normalise every line against the real catalogue. Unknown tracks
  // and malformed entries are dropped. Every line is one Personal Licence, so a
  // line is just a validated track reference.
  const lines: BasketLine[] = []
  const seen = new Set<string>()
  for (const entry of rawLines as Array<Record<string, unknown>>) {
    const trackId = typeof entry?.trackId === "string" ? entry.trackId : ""
    if (!trackId || seen.has(trackId)) continue
    const track = getTrackById(trackId)
    if (!track) continue
    seen.add(trackId)
    lines.push({ trackId })
  }

  const quote = quoteBasket(lines, isVerifiedSubscriber)

  return NextResponse.json({
    isSubscriber: isVerifiedSubscriber,
    ...quote,
  })
}
