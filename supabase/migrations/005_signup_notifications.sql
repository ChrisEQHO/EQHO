-- Idempotency store for the notify-new-signup Edge Function.
-- The Supabase user id is the PRIMARY KEY, so a second webhook delivery for the
-- same new account fails the unique constraint and the function skips it —
-- guaranteeing exactly one owner notification per new user.
--
-- Safe to run multiple times (idempotent).

CREATE TABLE IF NOT EXISTS public.signup_notifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lock the table down. Only the service role (used by the Edge Function) may
-- touch it; no anon/authenticated access. RLS with no permissive policies for
-- those roles denies them by default.
ALTER TABLE public.signup_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages signup notifications" ON public.signup_notifications;
CREATE POLICY "Service role manages signup notifications" ON public.signup_notifications
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- The Edge Function connects with the service role key, which bypasses RLS, but
-- grant explicitly so the table is usable and anon/authenticated remain excluded.
GRANT ALL ON public.signup_notifications TO service_role;
REVOKE ALL ON public.signup_notifications FROM anon, authenticated;
