-- Supabase RLS Policies for eligible_students table
-- Ensures students can only access their own records

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "students_can_select_own_record" ON public.eligible_students;
DROP POLICY IF EXISTS "students_can_update_own_record" ON public.eligible_students;
DROP POLICY IF EXISTS "students_can_insert_own_record" ON public.eligible_students;
DROP POLICY IF EXISTS "anonymous_can_check_eligibility" ON public.eligible_students;

-- 2. Enable RLS
ALTER TABLE public.eligible_students ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anonymous users can check if their email exists (for eligibility check)
-- This allows first-time users to verify they're eligible before signing up
CREATE POLICY "anonymous_can_check_eligibility" ON public.eligible_students
  FOR SELECT
  USING (auth.role() = 'anon');

-- 4. Policy: Authenticated students can select their own record
CREATE POLICY "students_can_select_own_record" ON public.eligible_students
  FOR SELECT
  USING (
    auth.uid()::text = auth_id::text
    OR auth.role() = 'service_role'
  );

-- 5. Policy: Authenticated students can update their own record
CREATE POLICY "students_can_update_own_record" ON public.eligible_students
  FOR UPDATE
  USING (
    auth.uid()::text = auth_id::text
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid()::text = auth_id::text
    OR auth.role() = 'service_role'
  );

-- 6. Policy: Service role (backend) can insert/update for admin operations
CREATE POLICY "service_role_can_manage" ON public.eligible_students
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW eligible_students_profile AS
  SELECT
    id,
    email,
    full_name,
    auth_id,
    status,
    contact,
    whatsapp,
    age,
    school,
    class,
    scholarship,
    created_at,
    updated_at
  FROM public.eligible_students
  WHERE auth.uid()::text = auth_id::text;
