-- Ensure public.profiles table has all required columns
-- Run this FIRST before the trigger

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT DEFAULT '',
  plan TEXT DEFAULT 'none',
  subscription_status TEXT DEFAULT 'none',
  trial_active BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add trial_active column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_active') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN trial_active BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add trial_start column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_start') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN trial_start TIMESTAMPTZ;
  END IF;

  -- Add trial_end column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_end') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN trial_end TIMESTAMPTZ;
  END IF;

  -- Add stripe_customer_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- Add stripe_subscription_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- Add current_period_end column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'current_period_end') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;

  -- Add plan column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'none';
  END IF;

  -- Add subscription_status column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status') 
  THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'none';
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do anything
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
CREATE POLICY "Service role has full access" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');
