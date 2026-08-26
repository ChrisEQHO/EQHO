-- ============================================================================
-- EQHO Music Store — foundation schema (Phase 1)
--
-- Run this in the Supabase SQL editor (or via the CLI) once. It is idempotent:
-- every object is created with IF NOT EXISTS / DROP POLICY IF EXISTS, so it is
-- safe to re-run. See docs/store-setup.md for the full setup walkthrough.
--
-- Model:
--   store_categories  — how tracks are grouped in the storefront
--   store_tracks      — a purchasable/streamable track. Holds the Cloudflare R2
--                        object keys for the watermarked PREVIEW and the clean
--                        MASTER (audio itself lives in R2, never in Postgres).
--   store_purchases   — a completed à-la-carte purchase of a single track by a
--                        user. Subscription access is handled separately via
--                        profiles.subscription_status; a purchase is the
--                        permanent, non-subscription grant.
--
-- Entitlement to the clean master = admin OR active/trialing subscription
-- (when the track is included_in_subscription) OR a completed purchase row.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_categories_sort ON public.store_categories(sort_order);

-- ----------------------------------------------------------------------------
-- Tracks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  artist       TEXT DEFAULT '',
  category_id  UUID REFERENCES public.store_categories(id) ON DELETE SET NULL,
  description  TEXT DEFAULT '',
  duration_seconds INT NOT NULL DEFAULT 0,
  bpm          INT,
  -- Price for a one-off (à-la-carte) purchase, in the smallest currency unit
  -- (e.g. pence). Nullable = not individually purchasable (subscription only).
  price_cents  INT,
  currency     TEXT NOT NULL DEFAULT 'gbp',
  -- Cloudflare R2 object keys. Preview = audible-watermarked clip served to
  -- everyone; master = clean file served only to entitled users. Both are
  -- uploaded by an admin (no server-side audio processing).
  preview_key  TEXT,
  master_key   TEXT,
  -- Whether an active subscription grants the clean master for this track.
  included_in_subscription BOOLEAN NOT NULL DEFAULT TRUE,
  -- Set once the matching Stripe Price exists (used by the later checkout phase).
  stripe_price_id TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_tracks_category ON public.store_tracks(category_id);
CREATE INDEX IF NOT EXISTS idx_store_tracks_published ON public.store_tracks(is_published);

-- ----------------------------------------------------------------------------
-- Purchases (à-la-carte)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id     UUID NOT NULL REFERENCES public.store_tracks(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'gbp',
  -- 'pending' when a checkout is created, 'completed' once the webhook confirms
  -- payment. Only 'completed' rows grant download access.
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_purchases_user ON public.store_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_track ON public.store_purchases(track_id);
-- A user can only hold ONE completed purchase per track (prevents double grants
-- and double charges surviving a retry). Pending rows are not constrained.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_store_purchase_completed
  ON public.store_purchases(user_id, track_id)
  WHERE status = 'completed';

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_tracks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases  ENABLE ROW LEVEL SECURITY;

-- Categories: anyone (even anon) may read published categories.
DROP POLICY IF EXISTS "Public can read published categories" ON public.store_categories;
CREATE POLICY "Public can read published categories" ON public.store_categories
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Service role manages categories" ON public.store_categories;
CREATE POLICY "Service role manages categories" ON public.store_categories
  FOR ALL USING (auth.role() = 'service_role');

-- Tracks: anyone may read published tracks (needed for the public storefront).
DROP POLICY IF EXISTS "Public can read published tracks" ON public.store_tracks;
CREATE POLICY "Public can read published tracks" ON public.store_tracks
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Service role manages tracks" ON public.store_tracks;
CREATE POLICY "Service role manages tracks" ON public.store_tracks
  FOR ALL USING (auth.role() = 'service_role');

-- Purchases: a user may read only their own; writes happen via the service role
-- (Stripe webhook) only.
DROP POLICY IF EXISTS "Users read own purchases" ON public.store_purchases;
CREATE POLICY "Users read own purchases" ON public.store_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages purchases" ON public.store_purchases;
CREATE POLICY "Service role manages purchases" ON public.store_purchases
  FOR ALL USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Manual seed (OPTIONAL) — uncomment and edit to create a first category and a
-- couple of demo tracks so the storefront isn't empty before the admin CMS
-- phase lands. Upload the referenced R2 objects first (see docs/store-setup.md).
-- ----------------------------------------------------------------------------
-- INSERT INTO public.store_categories (slug, name, description, sort_order)
-- VALUES ('floor-routines', 'Floor Routines', 'Full-length competition floor music.', 1)
-- ON CONFLICT (slug) DO NOTHING;
--
-- INSERT INTO public.store_tracks
--   (slug, title, artist, category_id, description, duration_seconds, bpm,
--    price_cents, currency, preview_key, master_key, included_in_subscription, is_published)
-- VALUES
--   ('sunrise-floor', 'Sunrise', 'EQHO Studio',
--    (SELECT id FROM public.store_categories WHERE slug = 'floor-routines'),
--    'Uplifting 90-second floor cut with a strong finish.', 90, 128,
--    499, 'gbp',
--    'store/tracks/sunrise-floor/preview.mp3',
--    'store/tracks/sunrise-floor/master.mp3',
--    TRUE, TRUE)
-- ON CONFLICT (slug) DO NOTHING;
