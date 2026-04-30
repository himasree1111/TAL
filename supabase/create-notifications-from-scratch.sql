-- ============================================================
-- CREATE NOTIFICATIONS TABLE FROM SCRATCH
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop existing notifications_reads table (if exists)
-- This table is no longer needed
DROP TABLE IF EXISTS public.notifications_reads CASCADE;

-- Step 2: Backup and drop existing notifications table
-- Backup existing data before dropping
DROP TABLE IF EXISTS notifications_backup CASCADE;
CREATE TABLE notifications_backup AS SELECT * FROM notifications;

-- Drop the notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Step 3: Create fresh notifications table
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT DEFAULT 'all' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- Step 4: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage notifications" ON public.notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon users read access (for custom auth flow)
CREATE POLICY "Anon users can read notifications" ON public.notifications
  FOR SELECT
  TO anon
  USING (true);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_notifications_audience ON public.notifications(audience);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at);

-- Step 7: Optional - Add sample notification
INSERT INTO public.notifications (title, message, audience, expires_at)
VALUES (
  'Welcome to TAL',
  'Welcome to The American Legacy! Your educational journey begins here.',
  'all',
  NULL
);

-- ============================================================
-- DONE!
-- The notifications table is now fresh and ready to use.
-- Run the SQL above in Supabase SQL Editor.
-- ============================================================
