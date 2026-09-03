import { NextRequest, NextResponse } from "next/server"
import { getTrackById } from "@/lib/music/seed/tracks"
import { LICENCE_TIERS } from "@/lib/music/seed/licence-tiers"
import { resolveMusicSubscriber } from "@/lib/music/subscriber"
import { quoteBasket } from "@/lib/music/pricing"
import type { BasketLine, LicenceTierId } from "@/lib/music/types"

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

  // Validate + normalise every line against the real catalogue. Unknown tracks,
  // tiers not offered by that track, or malformed entries are dropped.
  const lines: BasketLine[] = []
  for (const entry of rawLines as Array<Record<string, unknown>>) {
    const trackId = typeof entry?.trackId === "string" ? entry.trackId : ""
    const tierId = typeof entry?.tierId === "string" ? (entry.tierId as LicenceTierId) : ("" as LicenceTierId)
    const track = getTrackById(trackId)
    if (!track) continue
    if (!(tierId in LICENCE_TIERS)) continue
    if (!track.availableTiers.includes(tierId)) continue
    lines.push({ trackId, tierId })
  }

  const quote = quoteBasket(lines, isVerifiedSubscriber)

  return NextResponse.json({
    isSubscriber: isVerifiedSubscriber,
    ...quote,
  })
}
