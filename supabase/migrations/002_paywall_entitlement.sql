-- Paywall / entitlement support columns for the 1 Sep 2026 changeover.
-- Idempotent: safe to run more than once. Run in the Supabase SQL editor.
--
-- Adds the fields the Stripe webhook and entitlement rule need beyond what
-- migration 001 provided:
--   • trial_start          — when THIS user's own 30-day trial began
--   • cancel_at_period_end — Stripe flag; access continues until the period end
--   • has_used_trial       — anti-repeat guard so a user can't restart the trial
--   • last_stripe_event_id — webhook idempotency (skip already-processed events)
--   • updated_at           — last time the subscription fields were written

DO $$
BEGIN
  -- trial_start
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_start timestamptz;
  END IF;

  -- cancel_at_period_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;

  -- has_used_trial
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_used_trial'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_used_trial boolean DEFAULT false;
  END IF;

  -- last_stripe_event_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_stripe_event_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_stripe_event_id text;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz;
  END IF;
END $$;

-- Backfill has_used_trial for anyone who already started or completed a trial,
-- so existing trialing/active users are never offered a fresh trial again.
UPDATE profiles
  SET has_used_trial = true
  WHERE has_used_trial IS DISTINCT FROM true
    AND (trial_end IS NOT NULL OR subscription_status IN ('trialing', 'active', 'past_due', 'canceled'));
