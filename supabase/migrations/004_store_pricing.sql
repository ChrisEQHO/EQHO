-- ============================================================================
-- EQHO Music Store — dual pricing (Phase 2: à-la-carte checkout)
--
-- Run this in the Supabase SQL editor AFTER 003_store_schema.sql. Idempotent:
-- safe to re-run.
--
-- Adds a second, lower price for EQHO customers (people with an active/trialing
-- subscription). The existing store_tracks.price_cents stays as the STANDARD
-- public price; customer_price_cents is the reduced price shown/charged to EQHO
-- customers. Example from the brief: standard £19.99 (1999), customer £9.99 (999).
--
-- Pricing is ALWAYS recomputed server-side at checkout (lib/store/pricing.ts);
-- these columns are the source values, never trusted from the browser.
-- ============================================================================

ALTER TABLE public.store_tracks
  ADD COLUMN IF NOT EXISTS customer_price_cents INT;

COMMENT ON COLUMN public.store_tracks.price_cents IS
  'Standard public one-off price in the smallest currency unit (e.g. pence). null = not individually purchasable.';
COMMENT ON COLUMN public.store_tracks.customer_price_cents IS
  'Reduced price for EQHO customers (active/trialing subscribers), smallest currency unit. null = customers pay the standard price.';

-- Optional: a separate Stripe Price for the customer rate. Left here for teams
-- that prefer pre-created Stripe Prices; the checkout route works without it by
-- pricing inline from these columns.
ALTER TABLE public.store_tracks
  ADD COLUMN IF NOT EXISTS stripe_customer_price_id TEXT;

-- ----------------------------------------------------------------------------
-- Backfill guidance (OPTIONAL) — set a customer price on existing purchasable
-- tracks. Edit the amounts to taste, then uncomment and run.
-- ----------------------------------------------------------------------------
-- UPDATE public.store_tracks
--   SET customer_price_cents = 999
--   WHERE price_cents IS NOT NULL AND customer_price_cents IS NULL;
