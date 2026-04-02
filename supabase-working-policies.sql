-- WORKING Supabase Policies - SIMPLE & TESTED
-- Copy ALL → Supabase SQL Editor → Run

-- 1. Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'student_documents';

-- 2. Table RLS - SIMPLE (auth users can do everything)
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- Users can SELECT
CREATE POLICY "Authenticated users can read student_documents" ON student_documents
FOR SELECT USING (auth.role() = 'authenticated');

-- Users can INSERT  
CREATE POLICY "Authenticated users can insert student_documents" ON student_documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
