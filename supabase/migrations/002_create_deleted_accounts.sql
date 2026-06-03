-- Create deleted_accounts table to log account deletions
-- This table stores information about deleted accounts for analytics

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add an index on deleted_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_deleted_at ON deleted_accounts(deleted_at);

-- Add RLS policies
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only allow insert (users can log their own deletion)
CREATE POLICY "Users can insert their own deletion record"
  ON deleted_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to read all records
CREATE POLICY "Service role can read all deletion records"
  ON deleted_accounts
  FOR SELECT
  USING (auth.role() = 'service_role');
