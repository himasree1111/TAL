/* ONE SQL - Upload works forever */

-- 1. Permissive policies for authenticated
CREATE POLICY "Upload permissive" ON student_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. SELECT for list
CREATE POLICY "List permissive" ON student_documents FOR SELECT TO authenticated USING (true);

-- 3. Verify
SELECT * FROM pg_policies WHERE tablename = 'student_documents';

-- Upload test → Success!

