-- Backfill profiles for existing auth.users who don't have a profile yet
-- Run this AFTER creating the trigger

INSERT INTO public.profiles (id, email, full_name, plan, subscription_status, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'none',
  'none',
  COALESCE(au.created_at, NOW())
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
