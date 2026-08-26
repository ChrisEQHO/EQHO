# EQHO Music Store — setup (Phase 1: foundation)

This is the first slice of the music store: the data model, entitlement/audio
delivery helpers, and the buyer-facing browse + detail pages. Purchasing (Stripe
à-la-carte checkout), a "My Music" library, the admin CMS, and analytics come in
later phases.

Because integrations/scripts are managed manually, the two setup steps below are
done by you: run one SQL migration, and upload audio to Cloudflare R2. Until the
migration runs, `/store` shows a friendly "opening soon" empty state.

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
- All writes go through the service role (server code / the future webhook).

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
   price_cents, currency, preview_key, master_key, included_in_subscription, is_published)
values
  ('sunrise-floor', 'Sunrise', 'EQHO Studio',
   (select id from public.store_categories where slug = 'floor-routines'),
   'Uplifting 90-second floor cut with a strong finish.', 90, 128,
   499, 'gbp',
   'store/tracks/sunrise-floor/preview.mp3',
   'store/tracks/sunrise-floor/master.mp3',
   true, true);
```

`price_cents` is the smallest currency unit (499 = £4.99). Leave it `null` for a
subscription-only track. `included_in_subscription = true` means an active
subscriber gets the clean master for free.

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

## What's wired up now vs later

- **Now:** browse `/store`, track detail `/store/[slug]`, watermarked preview
  playback, and clean-master **download** for already-entitled users
  (subscribers, admins, or anyone with a purchase row).
- **Later phases:** Stripe checkout for individual purchases (the "Buy" button is
  intentionally disabled with a "coming soon" note until then), the purchase
  webhook that writes `store_purchases`, a "My Music" library page, the admin
  upload/CMS UI, and store analytics.

## Files added in this phase

- `supabase/migrations/003_store_schema.sql` — schema + RLS + seed template.
- `lib/store/{types,catalog,entitlement,r2-keys,format}.ts` — data + access helpers.
- `app/api/store/audio/route.ts` — preview (open) + master (gated) streaming.
- `app/store/page.tsx`, `app/store/[slug]/page.tsx` — buyer-facing pages.
- `components/store/{track-card,track-preview-player,track-detail-cta}.tsx` — UI.
- Store links added to header/footer nav in `lib/marketing-config.ts`.
