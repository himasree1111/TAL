-- COMPLETE Supabase Policies - COPY ALL THIS BLOCK
-- Supabase Dashboard → SQL → New Query → Paste → Run ALL

-- 0. Drop existing (safe)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all
