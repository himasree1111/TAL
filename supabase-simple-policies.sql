-- SIMPLEST Supabase Policies - DROP & RECREATE
-- Run ALL in Supabase SQL Editor

-- 1. DROP existing policies (safe)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY
