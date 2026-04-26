-- ============================================================
-- BACKEND FIX: Approve/Disapprove Status Update & Auto-Move
-- ============================================================
-- Problem: When admin approves/disapproves a student in Manage
-- Beneficiaries, the student doesn't move to eligible_students
-- or non_eligible_students tables.
--
-- This SQL script fixes ALL backend issues:
-- 1. Ensures status column exists with proper default
-- 2. Fixes the trigger function with SECURITY DEFINER
-- 3. Ensures unique constraints for ON CONFLICT
-- 4. Handles RLS for trigger operations
-- 5. Provides manual fix functions
-- ============================================================

-- ============================================================
-- STEP 1: Ensure admin_student_info has status column
-- ============================================================

-- Add status column if it doesn't exist
ALTER TABLE public.admin_student_info
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Fix any NULL statuses to 'Pending'
UPDATE public.admin_student_info
SET status = 'Pending'
WHERE status IS NULL;

-- ============================================================
-- STEP 2: Ensure target tables exist with correct structure
-- ============================================================

-- Create eligible_students if it doesn't exist
CREATE TABLE IF NOT EXISTS public.eligible_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    contact TEXT,
    whatsapp TEXT,
    student_contact TEXT,
    parent_contact_2 TEXT,
    address TEXT,
    age INTEGER,
    class TEXT,
    school TEXT,
    prev_percent TEXT,
    present_percent TEXT,
    academic_achievements TEXT,
    non_academic_achievements TEXT,
    academic_achievements_choice TEXT,
    non_academic_achievements_choice TEXT,
    scholarship TEXT,
    has_scholarship BOOLEAN,
    does_work BOOLEAN,
    earning_members INTEGER,
    volunteer_name TEXT,
    volunteer_contact TEXT,
    camp_name TEXT,
    camp_date DATE,
    status TEXT DEFAULT 'Eligible',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_single_parent BOOLEAN DEFAULT FALSE,
    special_remarks TEXT,
    student_id BIGINT,
    student_public_id TEXT,
    doc_verification_count INTEGER DEFAULT 0
);

-- Create non_eligible_students if it doesn't exist
CREATE TABLE IF NOT EXISTS public.non_eligible_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    contact TEXT,
    whatsapp TEXT,
    student_contact TEXT,
    parent_contact_2 TEXT,
    address TEXT,
    age INTEGER,
    class TEXT,
    school TEXT,
    prev_percent TEXT,
    present_percent TEXT,
    academic_achievements TEXT,
    non_academic_achievements TEXT,
    academic_achievements_choice TEXT,
    non_academic_achievements_choice TEXT,
    scholarship TEXT,
    has_scholarship BOOLEAN,
    does_work BOOLEAN,
    earning_members INTEGER,
    volunteer_name TEXT,
    volunteer_contact TEXT,
    camp_name TEXT,
    camp_date DATE,
    status TEXT DEFAULT 'Not Eligible',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_single_parent BOOLEAN DEFAULT FALSE,
    special_remarks TEXT,
    student_id BIGINT,
    student_public_id TEXT
);

-- ============================================================
-- STEP 3: Enable RLS on target tables (if not already)
-- ============================================================

ALTER TABLE public.eligible_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_eligible_students ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.eligible_students;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.non_eligible_students;
DROP POLICY IF EXISTS "Enable all for service_role" ON public.eligible_students;
DROP POLICY IF EXISTS "Enable all for service_role" ON public.non_eligible_students;

-- Allow authenticated users to read
CREATE POLICY "Enable read for authenticated" ON public.eligible_students
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated" ON public.non_eligible_students
    FOR SELECT TO authenticated USING (true);

-- Allow service_role and trigger function full access
CREATE POLICY "Enable all for service_role" ON public.eligible_students
    FOR ALL TO service_role USING (true) WITH CHECK (true);
    
CREATE POLICY "Enable all for service_role" ON public.non_eligible_students
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 4: Create the main trigger function with SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_move_student_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'Eligible', insert/update eligible_students
  IF NEW.status = 'Eligible' AND (OLD.status IS NULL OR OLD.status != 'Eligible') THEN
    INSERT INTO public.eligible_students (
      full_name, email, contact, whatsapp, student_contact,
      parent_contact_2, address, age, class, school, prev_percent, present_percent,
      academic_achievements, non_academic_achievements, academic_achievements_choice,
      non_academic_achievements_choice, scholarship, has_scholarship, does_work,
      earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
      status, created_at, updated_at, is_single_parent, special_remarks,
      student_id, student_public_id
    )
    VALUES (
      NEW.full_name, NEW.email, NEW.contact, NEW.whatsapp,
      NEW.student_contact, NEW.parent_contact_2, NEW.address, NEW.age, NEW.class,
      NEW.school, NEW.prev_percent, NEW.present_percent,
      NEW.academic_achievements, NEW.non_academic_achievements,
      NEW.academic_achievements_choice, NEW.non_academic_achievements_choice,
      NEW.scholarship, NEW.has_scholarship, NEW.does_work, NEW.earning_members,
      NEW.volunteer_name, NEW.volunteer_contact, NEW.camp_name, NEW.camp_date,
      'Eligible', NEW.created_at, NOW(), NEW.is_single_parent, NEW.special_remarks,
      NEW.student_id, NEW.student_public_id
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      contact = EXCLUDED.contact,
      whatsapp = EXCLUDED.whatsapp,
      student_contact = EXCLUDED.student_contact,
      parent_contact_2 = EXCLUDED.parent_contact_2,
      address = EXCLUDED.address,
      age = EXCLUDED.age,
      class = EXCLUDED.class,
      school = EXCLUDED.school,
      prev_percent = EXCLUDED.prev_percent,
      present_percent = EXCLUDED.present_percent,
      academic_achievements = EXCLUDED.academic_achievements,
      non_academic_achievements = EXCLUDED.non_academic_achievements,
      academic_achievements_choice = EXCLUDED.academic_achievements_choice,
      non_academic_achievements_choice = EXCLUDED.non_academic_achievements_choice,
      scholarship = EXCLUDED.scholarship,
      has_scholarship = EXCLUDED.has_scholarship,
      does_work = EXCLUDED.does_work,
      earning_members = EXCLUDED.earning_members,
      volunteer_name = EXCLUDED.volunteer_name,
      volunteer_contact = EXCLUDED.volunteer_contact,
      camp_name = EXCLUDED.camp_name,
      camp_date = EXCLUDED.camp_date,
      status = 'Eligible',
      updated_at = NOW(),
      is_single_parent = EXCLUDED.is_single_parent,
      special_remarks = EXCLUDED.special_remarks,
      student_id = EXCLUDED.student_id,
      student_public_id = EXCLUDED.student_public_id;

  -- When status changes to 'Not Eligible', insert/update non_eligible_students
  ELSIF NEW.status = 'Not Eligible' AND (OLD.status IS NULL OR OLD.status != 'Not Eligible') THEN
    INSERT INTO public.non_eligible_students (
      full_name, email, contact, whatsapp, student_contact,
      parent_contact_2, address, age, class, school, prev_percent, present_percent,
      academic_achievements, non_academic_achievements, academic_achievements_choice,
      non_academic_achievements_choice, scholarship, has_scholarship, does_work,
      earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
      status, created_at, updated_at, is_single_parent, special_remarks,
      student_id, student_public_id
    )
    VALUES (
      NEW.full_name, NEW.email, NEW.contact, NEW.whatsapp,
      NEW.student_contact, NEW.parent_contact_2, NEW.address, NEW.age, NEW.class,
      NEW.school, NEW.prev_percent, NEW.present_percent,
      NEW.academic_achievements, NEW.non_academic_achievements,
      NEW.academic_achievements_choice, NEW.non_academic_achievements_choice,
      NEW.scholarship, NEW.has_scholarship, NEW.does_work, NEW.earning_members,
      NEW.volunteer_name, NEW.volunteer_contact, NEW.camp_name, NEW.camp_date,
      'Not Eligible', NEW.created_at, NOW(), NEW.is_single_parent, NEW.special_remarks,
      NEW.student_id, NEW.student_public_id
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      contact = EXCLUDED.contact,
      whatsapp = EXCLUDED.whatsapp,
      student_contact = EXCLUDED.student_contact,
      parent_contact_2 = EXCLUDED.parent_contact_2,
      address = EXCLUDED.address,
      age = EXCLUDED.age,
      class = EXCLUDED.class,
      school = EXCLUDED.school,
      prev_percent = EXCLUDED.prev_percent,
      present_percent = EXCLUDED.present_percent,
      academic_achievements = EXCLUDED.academic_achievements,
      non_academic_achievements = EXCLUDED.non_academic_achievements,
      academic_achievements_choice = EXCLUDED.academic_achievements_choice,
      non_academic_achievements_choice = EXCLUDED.non_academic_achievements_choice,
      scholarship = EXCLUDED.scholarship,
      has_scholarship = EXCLUDED.has_scholarship,
      does_work = EXCLUDED.does_work,
      earning_members = EXCLUDED.earning_members,
      volunteer_name = EXCLUDED.volunteer_name,
      volunteer_contact = EXCLUDED.volunteer_contact,
      camp_name = EXCLUDED.camp_name,
      camp_date = EXCLUDED.camp_date,
      status = 'Not Eligible',
      updated_at = NOW(),
      is_single_parent = EXCLUDED.is_single_parent,
      special_remarks = EXCLUDED.special_remarks,
      student_id = EXCLUDED.student_id,
      student_public_id = EXCLUDED.student_public_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 5: Drop and recreate the trigger
-- ============================================================

DROP TRIGGER IF EXISTS trg_admin_student_info_status_change ON public.admin_student_info;

CREATE TRIGGER trg_admin_student_info_status_change
  AFTER UPDATE OF status ON public.admin_student_info
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_move_student_on_status_change();

-- ============================================================
-- STEP 6: Create RPC function for manual move (Non-Eligible → Eligible)
-- ============================================================

CREATE OR REPLACE FUNCTION public.move_to_eligible_from_non_eligible(p_id UUID)
RETURNS VOID AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Get the non-eligible student record
  SELECT * INTO v_record
  FROM public.non_eligible_students
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Non-eligible student with id % not found', p_id;
  END IF;

  -- Update admin_student_info status back to Eligible
  UPDATE public.admin_student_info
  SET status = 'Eligible',
      updated_at = NOW()
  WHERE email = v_record.email;

  -- The trigger on admin_student_info will handle inserting into eligible_students
  -- Delete from non_eligible_students
  DELETE FROM public.non_eligible_students
  WHERE id = p_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 7: Grant execute permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO service_role;

-- ============================================================
-- STEP 8: Create helper function to manually approve/disapprove a student
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_student(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.admin_student_info
  SET status = 'Eligible',
      updated_at = NOW()
  WHERE id = p_student_id
  RETURNING to_jsonb(admin_student_info.*) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found with id: ' || p_student_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'student', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.disapprove_student(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.admin_student_info
  SET status = 'Not Eligible',
      updated_at = NOW()
  WHERE id = p_student_id
  RETURNING to_jsonb(admin_student_info.*) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found with id: ' || p_student_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'student', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disapprove_student(UUID) TO authenticated;

-- ============================================================
-- STEP 9: Create function to sync any missed students
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_approved_students()
RETURNS TABLE (
  email TEXT,
  status TEXT,
  action_taken TEXT
) AS $$
BEGIN
  -- Sync students with status='Eligible' but missing from eligible_students
  RETURN QUERY
  SELECT 
    a.email,
    a.status,
    'INSERTED to eligible_students'::TEXT as action_taken
  FROM public.admin_student_info a
  LEFT JOIN public.eligible_students e ON a.email = e.email
  WHERE a.status = 'Eligible'
    AND e.email IS NULL;

  -- Insert them
  INSERT INTO public.eligible_students (
    full_name, email, contact, whatsapp, student_contact,
    parent_contact_2, address, age, class, school, prev_percent, present_percent,
    academic_achievements, non_academic_achievements, academic_achievements_choice,
    non_academic_achievements_choice, scholarship, has_scholarship, does_work,
    earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
    status, created_at, updated_at, is_single_parent, special_remarks,
    student_id, student_public_id
  )
  SELECT 
    full_name, email, contact, whatsapp, student_contact,
    parent_contact_2, address, age, class, school, prev_percent, present_percent,
    academic_achievements, non_academic_achievements, academic_achievements_choice,
    non_academic_achievements_choice, scholarship, has_scholarship, does_work,
    earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
    'Eligible', created_at, NOW(), is_single_parent, special_remarks,
    student_id, student_public_id
  FROM public.admin_student_info a
  LEFT JOIN public.eligible_students e ON a.email = e.email
  WHERE a.status = 'Eligible'
    AND e.email IS NULL;

  -- Sync students with status='Not Eligible' but missing from non_eligible_students
  RETURN QUERY
  SELECT 
    a.email,
    a.status,
    'INSERTED to non_eligible_students'::TEXT as action_taken
  FROM public.admin_student_info a
  LEFT JOIN public.non_eligible_students n ON a.email = n.email
  WHERE a.status = 'Not Eligible'
    AND n.email IS NULL;

  INSERT INTO public.non_eligible_students (
    full_name, email, contact, whatsapp, student_contact,
    parent_contact_2, address, age, class, school, prev_percent, present_percent,
    academic_achievements, non_academic_achievements, academic_achievements_choice,
    non_academic_achievements_choice, scholarship, has_scholarship, does_work,
    earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
    status, created_at, updated_at, is_single_parent, special_remarks,
    student_id, student_public_id
  )
  SELECT 
    full_name, email, contact, whatsapp, student_contact,
    parent_contact_2, address, age, class, school, prev_percent, present_percent,
    academic_achievements, non_academic_achievements, academic_achievements_choice,
    non_academic_achievements_choice, scholarship, has_scholarship, does_work,
    earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
    'Not Eligible', created_at, NOW(), is_single_parent, special_remarks,
    student_id, student_public_id
  FROM public.admin_student_info a
  LEFT JOIN public.non_eligible_students n ON a.email = n.email
  WHERE a.status = 'Not Eligible'
    AND n.email IS NULL;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_approved_students() TO authenticated;

-- ============================================================
-- STEP 10: Verify trigger exists
-- ============================================================

SELECT
  'Trigger verification:' as check_type,
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  CASE 
    WHEN tgname = 'trg_admin_student_info_status_change' THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.admin_student_info'::regclass
  AND NOT tgisinternal;

-- ============================================================
-- STEP 11: Show current counts for verification
-- ============================================================

SELECT 'admin_student_info' as table_name, status, COUNT(*) as count
FROM public.admin_student_info
GROUP BY status
UNION ALL
SELECT 'eligible_students' as table_name, status, COUNT(*) as count
FROM public.eligible_students
GROUP BY status
UNION ALL
SELECT 'non_eligible_students' as table_name, status, COUNT(*) as count
FROM public.non_eligible_students
GROUP BY status;

-- ============================================================
-- STEP 12: Diagnostic - Check for students in wrong state
-- ============================================================

-- Students with status 'Eligible' but still in admin_student_info
SELECT 'Students with Eligible status in admin_student_info' as issue,
       COUNT(*) as count
FROM public.admin_student_info
WHERE status = 'Eligible'

UNION ALL

-- Students with status 'Not Eligible' but still in admin_student_info
SELECT 'Students with Not Eligible status in admin_student_info' as issue,
       COUNT(*) as count
FROM public.admin_student_info
WHERE status = 'Not Eligible'

UNION ALL

-- Students in eligible_students without matching admin status
SELECT 'Orphan eligible_students (no matching admin record)' as issue,
       COUNT(*) as count
FROM public.eligible_students e
LEFT JOIN public.admin_student_info a ON e.email = a.email
WHERE a.email IS NULL;
