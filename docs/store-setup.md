# EQHO Music Store — setup (Phases 1–2)

The music store covers the data model, entitlement/audio delivery, the
buyer-facing browse + detail pages, and — as of Phase 2 — **dual pricing and
à-la-carte Stripe checkout** for individual track purchases. A "My Music"
purchased-library view, the admin CMS, and analytics come in later phases.

Because integrations/scripts are managed manually, the setup steps below are done
by you: run two SQL migrations, and upload audio to Cloudflare R2. Until the
migrations run, `/store` shows a friendly "opening soon" empty state.

---

## 1. Run the database migration

Apply `supabase/migrations/003_store_schema.sql` once in the Supabase SQL editor
(or via the Supabase CLI). It is idempotent and safe to re-run. It creates:

| Table              | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `store_categories` | Groups tracks into storefront sections.                            |
| `store_tracks`     | A purchasable/streamable track + its R2 `preview_key`/`master_key`.|
| `store_purchases`  | A user's completed à-la-carte purchase of a track.                 |

Row Level Security is enabled on all three:

- Anyone (even signed-out) can read **published** categories and tracks.
- A user can read only their **own** purchase rows.
- All writes go through the service role (server code / the Stripe webhook).

Then apply `supabase/migrations/004_store_pricing.sql` (also idempotent). It adds
the **dual-price** columns to `store_tracks`:

| Column                     | Meaning                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `price_cents`              | Standard public price (e.g. `1999` = £19.99). `null` = not for sale.|
| `customer_price_cents`     | Reduced EQHO-customer price (e.g. `999` = £9.99). `null` = no discount, customers pay standard. |
| `stripe_customer_price_id` | Optional pre-created Stripe Price for the customer rate (unused by default — checkout prices inline). |

An **EQHO customer** = anyone whose `profiles.subscription_status` is `active` or
`trialing` (plus admins). They get `customer_price_cents`; everyone else pays
`price_cents`. This is enforced server-side (see below), never from the browser.

## 2. Upload audio to Cloudflare R2

Audio is **not** stored in Postgres. It lives in the existing private R2 bucket
under a shared `store/` namespace (separate from per-user `users/<id>/...`):

```
store/tracks/<track-slug>/preview.mp3   <- audible-watermarked clip (public)
store/tracks/<track-slug>/master.mp3    <- clean master (entitled users only)
```

You upload **both** files per track — the app does no server-side audio
processing. The preview should carry an audible watermark (e.g. a periodic voice
tag) because it is served to everyone; the master is the clean file delivered
only to entitled users. Helpers `storePreviewKey`/`storeMasterKey` in
`lib/store/r2-keys.ts` produce the suggested keys, but any key under `store/` is
accepted — just record the exact key you used in the track row.

## 3. Create categories and tracks

Uncomment and edit the seed block at the bottom of the migration, or insert
rows manually. Set `preview_key`/`master_key` to the R2 keys from step 2, and set
`is_published = true` to make a track live. Example:

```sql
insert into public.store_categories (slug, name, description, sort_order)
values ('floor-routines', 'Floor Routines', 'Full-length competition floor music.', 1)
on conflict (slug) do nothing;

insert into public.store_tracks
  (slug, title, artist, category_id, description, duration_seconds, bpm,
   price_cents, customer_price_cents, currency, preview_key, master_key,
   included_in_subscription, is_published)
values
  ('sunrise-floor', 'Sunrise', 'EQHO Studio',
   (select id from public.store_categories where slug = 'floor-routines'),
   'Uplifting 90-second floor cut with a strong finish.', 90, 128,
   1999, 999, 'gbp',
   'store/tracks/sunrise-floor/preview.mp3',
   'store/tracks/sunrise-floor/master.mp3',
   false, true);
```

`price_cents` / `customer_price_cents` are in the smallest currency unit
(`1999` = £19.99 standard, `999` = £9.99 for EQHO customers). Leave `price_cents`
`null` for a subscription-only track, or `customer_price_cents` `null` for no
customer discount. `included_in_subscription = true` means an active subscriber
gets the clean master for free — so à-la-carte pricing is most useful on tracks
where `included_in_subscription = false` (subscribers still get the lower rate).

---

## How access is decided

The clean master (`/api/store/audio?slug=…&type=master`) is granted when **any**
of these is true (see `lib/store/entitlement.ts`):

1. **Admin** — the signed-in email is in `ADMIN_EMAILS`.
2. **Subscription** — the track is `included_in_subscription` **and** the user's
   `profiles.subscription_status` is `active` or `trialing` (same rule as player
   access in `lib/access.ts`).
3. **Purchase** — the user has a `completed` row in `store_purchases` for the track.

Everyone — including signed-out visitors — can always stream the watermarked
**preview** (`type=preview`). The master endpoint returns `403` without access.

## How buying a track works (Phase 2)

1. A signed-in, non-entitled user clicks **Buy** on `/store/[slug]`. The button
   posts only the track **slug** to `POST /api/store/checkout`.
2. The route (`app/api/store/checkout/route.ts`) does everything server-side:
   - requires an authenticated user;
   - loads the track from the database and confirms it is published and has a
     master;
   - rejects if the user **already owns** it (a `completed` purchase exists);
   - **recomputes the price** with `lib/store/pricing.ts` from the track columns
     and the caller's own `subscription_status` — the browser never sends a
     price, so it cannot be tampered with;
   - writes a `pending` `store_purchases` row (reusing an existing pending row for
     the same user+track), then creates a Stripe **payment** Checkout Session with
     the amount set inline via `price_data`, plus an **idempotency key** so a
     retry can't double-charge.
3. On success Stripe redirects to `/store/[slug]?purchased=1`; on cancel to
   `?canceled=1`.
4. The Stripe **webhook** (`app/api/webhooks/stripe/route.ts`) receives
   `checkout.session.completed`, detects the store purchase
   (`metadata.kind === 'store_track_purchase'` / `mode === 'payment'`), and marks
   the `store_purchases` row `completed`. That row is what grants the master
   download. The unique index `uniq_store_purchase_completed` prevents a duplicate
   grant surviving a webhook retry.

No new environment variables are needed — it reuses the same `STRIPE_SECRET_KEY`
and `STRIPE_WEBHOOK_SECRET` as the subscription flow. Make sure your Stripe
webhook endpoint has `checkout.session.completed` enabled (it already is for
subscriptions).

## What's wired up now vs later

- **Now:** browse `/store`, track detail `/store/[slug]`, watermarked preview
  playback, clean-master **download** for entitled users, **dual customer/standard
  pricing**, and **à-la-carte Stripe checkout** with server-enforced pricing and
  the webhook that records purchases.
- **Later phases:** a "My Music" purchased-library page and syncing purchased
  masters into the player's cloud library/playlists, the admin upload/CMS UI, and
  store analytics.

## Files in this feature

- `supabase/migrations/003_store_schema.sql` — schema + RLS + seed template.
- `supabase/migrations/004_store_pricing.sql` — dual-price columns.
- `lib/store/{types,catalog,entitlement,pricing,r2-keys,format}.ts` — data, access
  and pricing helpers.
- `app/api/store/audio/route.ts` — preview (open) + master (gated) streaming.
- `app/api/store/checkout/route.ts` — server-priced à-la-carte checkout session.
- `app/api/webhooks/stripe/route.ts` — records completed purchases (store branch).
- `app/store/page.tsx`, `app/store/[slug]/page.tsx` — buyer-facing pages.
- `components/store/{track-card,track-preview-player,track-detail-cta}.tsx` — UI.
- Store links added to header/footer nav in `lib/marketing-config.ts`.
