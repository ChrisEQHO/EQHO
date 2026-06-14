-- Add a `duration` column to the tracks table and backfill from the legacy
-- `duration_seconds` column. The app (lib/cloud-sync.ts) writes track length to
-- `duration`, so this aligns the schema with the application code.
--
-- Run this in your Supabase SQL editor.

-- 1) Add the canonical `duration` column if it doesn't already exist.
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- 2) Backfill `duration` from the legacy `duration_seconds` column, but only if
--    that legacy column actually exists (guards against errors on fresh DBs).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'duration_seconds'
  ) THEN
    UPDATE tracks
    SET duration = duration_seconds
    WHERE duration IS NULL;
  END IF;
END $$;

-- 3) Ask PostgREST (Supabase API layer) to reload its schema cache so the new
--    column is immediately available over the REST/JS client.
NOTIFY pgrst, 'reload schema';
