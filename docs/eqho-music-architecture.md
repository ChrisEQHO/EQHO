# EQHO Music — Architecture & Phase 2 plan

> **Status: Phase 1 — hidden, front-end-complete prototype.**
> No production infrastructure has been created. This document is the approval
> gate for Phase 2. Nothing here should be provisioned until explicitly signed off.

## 1. What Phase 1 actually is

A hidden licensing marketplace living under `/music`, built entirely on **seed
data** with **no live payments** and **no master audio**. It exists to review the
full product experience without risking the live EQHO Player, auth, subscription,
or entitlement systems.

**Guarantees honored:**

- The EQHO Player (`components/player/*`, `/app`, entitlement gate, subscription
  checkout) is **untouched**.
- `/music/*` returns a real **404 in production** for everyone except allowlisted
  emails / site admins. It is open in preview/dev for review only.
- **No fabricated purchase data.** Popularity and per-country figures are rendered
  as clearly-labelled "Sample — illustrative only" values and are never read from
  or written to any real purchase table. Real empty states ("no licences yet") are
  the truthful default for actual sales.
- No creator upload pipeline, no DB migrations, no live Stripe products/prices, no
  R2 master objects, no public nav/sitemap exposure.

## 2. Access / secrecy model

Owned by `app/music/layout.tsx` (server component) + `lib/music/access.ts`:

- `isMusicPreviewOpen()` → `NEXT_PUBLIC_V0_PREVIEW === '1'` **or**
  `NODE_ENV !== 'production'`.
- `isMusicAllowed(email)` → email ∈ `EQHO_MUSIC_ALLOWED_EMAILS` (new, comma-sep)
  **or** existing site admin (`ADMIN_EMAILS` via `lib/access.ts`).
- If neither preview-open nor allowlisted → `notFound()` (a genuine 404; the route
  is indistinguishable from non-existent).
- `proxy.ts` carves `/music` and `/api/music` out of the normal protected-route
  login redirect, so secrecy is the layout's 404 rather than a `/login` bounce that
  would leak the path's existence.

**To grant a reviewer production access:** add their email to
`EQHO_MUSIC_ALLOWED_EMAILS`. (Left unset intentionally — site admins in
`ADMIN_EMAILS` still get in.)

## 3. Current file map (Phase 1)

| Area | Path |
| --- | --- |
| Access gate | `lib/music/access.ts`, `app/music/layout.tsx` |
| Types | `lib/music/types.ts` |
| Seed data | `lib/music/seed/{creators,tracks,licence-tiers}.ts` |
| Catalog helpers | `lib/music/catalog.ts` |
| Pricing (server-authoritative) | `lib/music/pricing.ts` |
| Subscriber verification | `lib/music/subscriber.ts` |
| Pages | `app/music/{page,browse,creators,creator/[slug],track/[slug],basket}` |
| Components | `components/music/*` |
| APIs | `app/api/music/{quote,checkout}/route.ts` |
| Webhook (inert branch) | `app/api/webhooks/stripe/route.ts` → `music_licence_purchase` no-op |

## 4. Pricing & the subscriber discount

- All prices are in **pence, GBP**, defined only in `lib/music/seed/licence-tiers.ts`.
- `lib/music/pricing.ts#quoteBasket` is the single source of truth. The browser
  sends only `{ trackId, tierId }`; every amount is recomputed server-side.
- Verified EQHO subscribers get **10% off** (`SUBSCRIBER_DISCOUNT_RATE`). "Verified"
  = confirmed server-side against `profiles.subscription_status` ∈ {active, trialing}
  via the existing entitlement authority (`lib/music/subscriber.ts`). A client can
  never claim the discount.
- `/api/music/quote` re-prices on every basket review; the displayed total always
  comes from the server.

## 5. Checkout (Phase 1 = priced but gated OFF)

`app/api/music/checkout/route.ts`:

- Validates the basket against the catalogue, de-dupes to one licence per track,
  and computes the authoritative total via `quoteBasket`.
- **Returns `503 { phase: "preview" }`** instead of creating a Stripe session while
  `MUSIC_CHECKOUT_ENABLED !== "true"`. This is the deliberate "no live payments"
  stop, not a bug — the basket UI surfaces it as a friendly preview notice.
- The Phase 2 code path (inline `price_data`, idempotency key derived from the
  validated basket + total) is already present but inert.

## 6. Proposed Phase 2 production schema (NOT migrated yet)

All tables service-role-write-only; RLS read rules noted.

- `music_creators` — public read where `status='published'`.
- `music_tracks` — public read where `status='published'`; FK → creator.
- `music_track_versions` — preview vs master keys; **master keys never exposed to
  public read**.
- `music_licence_tiers` — tier catalogue (mirrors the seed).
- `music_purchases` — one row per paid Stripe session; read only by owning
  `user_id` (or guest via signed token). Written **only** by the webhook on a
  verified `checkout.session.completed`.
- `music_licences` — issued licence + certificate ref; same ownership rule.
- `music_limited_licences` — enforces exclusive/limited tiers (an exclusive sale
  removes the track from sale for everyone else).

## 7. Storage (R2) preview vs master separation

- `music/preview/*` — public, watermarked/short clips (Phase 1 uses the existing
  `public/audio/silence.wav` placeholder so player controls work honestly without
  fake masters).
- `music/master/*` — **private**; delivered only as short-lived signed URLs after a
  verified purchase. Never in a public bucket, never referenced from client code.

## 8. Stripe (Phase 2)

- Reuse the existing lazy `stripe` client and the proven `store_track_purchase`
  webhook pattern (idempotency, paid-status check, service-role writes).
- The webhook already recognises `music_licence_purchase` and currently no-ops it
  safely (it must route **before** the store `mode === 'payment'` branch).
- Guest checkout + guest recovery by email (Resend) to be implemented in Phase 2;
  Phase 1 collects email and shows the post-purchase state without persisting real
  licences.

## 9. Phase 2 enablement checklist (all require explicit approval)

1. Provision the schema in section 6 (with RLS).
2. Create the private `music/master/*` R2 space + signed-URL issuance.
3. Create live Stripe products/prices (or keep inline `price_data`).
4. Set `MUSIC_CHECKOUT_ENABLED=true`.
5. Implement `music_purchases`/`music_licences` writes in the webhook branch.
6. Build the creator upload pipeline (§54) and certificate/master delivery.
7. Decide public discovery/nav exposure (§55).
