-- Add subscription columns to existing profiles table
-- Run this in your Supabase SQL editor if columns don't already exist
--
-- NOTE: The canonical subscription column is `stripe_subscription_id`
-- (see 000_ensure_profiles_schema.sql). This file previously added a
-- conflicting `subscription_id` column; it now aligns with the canonical name.

-- Add subscription columns if they don't exist
DO $$
BEGIN
  -- stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;

  -- subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT 'free';
  END IF;

  -- stripe_subscription_id (canonical name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;

  -- Migrate data from a legacy `subscription_id` column if it exists, then drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_id'
  ) THEN
    UPDATE profiles 
      SET stripe_subscription_id = COALESCE(stripe_subscription_id, subscription_id);
    ALTER TABLE profiles DROP COLUMN subscription_id;
  END IF;

  -- trial_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_end timestamptz;
  END IF;

  -- current_period_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_period_end timestamptz;
  END IF;
END $$;

-- Create index on stripe_customer_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- Update RLS policy to allow service role updates (for webhooks)
-- The service role already bypasses RLS, so no changes needed there
