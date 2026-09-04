import "server-only"

import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { evaluateForUser, resolveUserFromRequest } from "@/lib/entitlement-server"

// Determines whether the caller is a VERIFIED EQHO subscriber and therefore
// entitled to the 10% EQHO Music discount (spec §29).
//
// "Verified" means we confirmed it server-side against the profiles table via
// the entitlement authority — never a client claim. A subscriber here is a user
// whose profile subscription_status is an actively-paying state (active or
// trialing). Free/expired users pay full price.
//
// In non-production (v0 preview / local dev) there is normally no Supabase
// session, so this returns false unless `?subscriber=1` is present — purely so
// the discounted UX can be reviewed. That override is ignored in production.
export async function resolveMusicSubscriber(
  request: NextRequest,
): Promise<{ isVerifiedSubscriber: boolean; email: string | null }> {
  // Review-only override, never trusted in production.
  if (process.env.NODE_ENV !== "production") {
    const override = request.nextUrl.searchParams.get("subscriber")
    if (override === "1") return { isVerifiedSubscriber: true, email: null }
  }

  try {
    const supabase = await createClient()
    const user = await resolveUserFromRequest(request, supabase)
    if (!user) return { isVerifiedSubscriber: false, email: null }

    const { profile } = await evaluateForUser(request, user)
    const status = profile?.subscription_status ?? null
    const isVerifiedSubscriber = status === "active" || status === "trialing"
    return { isVerifiedSubscriber, email: user.email ?? profile?.email ?? null }
  } catch {
    return { isVerifiedSubscriber: false, email: null }
  }
}

// Server-component variant (no NextRequest available). Reads the Supabase
// session directly. Used by track/basket pages purely to PREVIEW the discounted
// price — the checkout route re-verifies via resolveMusicSubscriber before any
// charge, so this display path is never trusted for money.
export async function isMusicSubscriber(): Promise<boolean> {
  try {
    const supabase = await createClient()
    if (!supabase) return false
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle()
    const status = (profile?.subscription_status as string | null) ?? null
    return status === "active" || status === "trialing"
  } catch {
    return false
  }
}
