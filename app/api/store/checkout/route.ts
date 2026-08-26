import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resolveTrackPricing } from '@/lib/store/pricing'
import type { StoreTrack } from '@/lib/store/types'
import type { SubscriptionStatus } from '@/lib/subscription-types'

// À-la-carte purchase of a single store track.
//
// SECURITY: every price-affecting value is derived on the server. The client
// sends only a track slug; the amount, currency and eligibility for the reduced
// EQHO-customer price are all recomputed here from the database and the caller's
// own subscription status. The browser can never influence what it is charged.

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    }

    // 1. Require a signed-in user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be signed in to buy a track.' }, { status: 401 })
    }

    // 2. Parse the request — the ONLY client input we trust is the slug.
    let slug = ''
    try {
      const body = await request.json()
      slug = typeof body?.slug === 'string' ? body.slug : ''
    } catch {
      /* ignore malformed body, handled below */
    }
    if (!slug) {
      return NextResponse.json({ error: 'Missing track.' }, { status: 400 })
    }

    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    }

    // 3. Load the track server-side and verify it is really purchasable.
    const { data: trackRow, error: trackError } = await admin
      .from('store_tracks')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (trackError) {
      console.error('[v0][store] checkout track lookup error:', trackError.message)
      return NextResponse.json({ error: 'Could not load the track.' }, { status: 500 })
    }
    const track = trackRow as StoreTrack | null
    if (!track) {
      return NextResponse.json({ error: 'Track not found.' }, { status: 404 })
    }
    if (!track.master_key) {
      return NextResponse.json({ error: 'This track is not available for download yet.' }, { status: 409 })
    }

    // 4. Already owned? Never create a second charge for the same track.
    const { data: existingCompleted } = await admin
      .from('store_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('track_id', track.id)
      .eq('status', 'completed')
      .maybeSingle()
    if (existingCompleted) {
      return NextResponse.json({ error: 'You already own this track.', alreadyOwned: true }, { status: 409 })
    }

    // 5. Recompute the price server-side from the caller's own subscription state.
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    const subscriptionStatus = (profile?.subscription_status as SubscriptionStatus) ?? null

    const pricing = resolveTrackPricing({ track, email: user.email, subscriptionStatus })
    if (!pricing.purchasable || pricing.applicableCents == null || pricing.applicableCents <= 0) {
      return NextResponse.json({ error: 'This track is not available for individual purchase.' }, { status: 409 })
    }
    const amountCents = pricing.applicableCents
    const currency = (pricing.currency || 'gbp').toLowerCase()

    // 6. Reuse an existing pending purchase for this user+track if one exists, so
    //    repeated clicks map to one logical order (and one Stripe idempotency key).
    let purchaseId: string
    const { data: pendingRow } = await admin
      .from('store_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('track_id', track.id)
      .eq('status', 'pending')
      .maybeSingle()
    if (pendingRow?.id) {
      purchaseId = pendingRow.id as string
      await admin
        .from('store_purchases')
        .update({ amount_cents: amountCents, currency, updated_at: new Date().toISOString() })
        .eq('id', purchaseId)
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('store_purchases')
        .insert({
          user_id: user.id,
          track_id: track.id,
          amount_cents: amountCents,
          currency,
          status: 'pending',
        })
        .select('id')
        .single()
      if (insertError || !inserted) {
        console.error('[v0][store] checkout pending insert error:', insertError?.message)
        return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
      }
      purchaseId = inserted.id as string
    }

    // 7. Reuse the user's Stripe customer if we already have one.
    const { data: customerProfile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    const customerId = (customerProfile?.stripe_customer_id as string | undefined) || undefined

    const origin = request.headers.get('origin') || 'https://www.eqho-player.com'

    // 8. Create a one-off payment Checkout Session. The amount is set inline from
    //    the server-computed price via price_data, so it cannot be tampered with.
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer: customerId,
        customer_email: customerId ? undefined : user.email || undefined,
        client_reference_id: user.id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: track.title,
                description: track.artist ? `${track.artist} — competition master` : 'Competition master',
              },
            },
          },
        ],
        payment_intent_data: {
          metadata: {
            kind: 'store_track_purchase',
            supabase_user_id: user.id,
            track_id: track.id,
            purchase_id: purchaseId,
          },
        },
        metadata: {
          kind: 'store_track_purchase',
          supabase_user_id: user.id,
          track_id: track.id,
          purchase_id: purchaseId,
          is_customer_price: pricing.isCustomerPrice ? 'true' : 'false',
        },
        success_url: `${origin}/store/${track.slug}?purchased=1`,
        cancel_url: `${origin}/store/${track.slug}?canceled=1`,
      },
      // Idempotency: repeated submits for the same pending order return the same
      // session instead of creating a second charge.
      { idempotencyKey: `store_purchase_${purchaseId}_${amountCents}` },
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const stripeErr = error as { message?: string; raw?: { message?: string } }
    const detail = stripeErr.message || stripeErr.raw?.message || 'Unknown error'
    console.error('[v0][store] checkout error:', detail)
    return NextResponse.json({ error: `Could not start checkout: ${detail}` }, { status: 500 })
  }
}
