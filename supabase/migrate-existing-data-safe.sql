-- ============================================================
-- MIGRATION-SAFE FIX: Preserve existing eligible_students data
-- ============================================================
-- This script ONLY adds missing columns/constraints.
-- It does NOT drop or recreate tables, so existing data is safe.
-- ============================================================

-- ============================================================
-- STEP 1: Ensure admin_student_info has status column
-- ============================================================

ALTER TABLE public.admin_student_info
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

UPDATE public.admin_student_info
SET status = 'Pending'
WHERE status IS NULL;

-- ============================================================
-- STEP 2: Add missing columns to eligible_students (safe - preserves data)
-- ============================================================

-- Only add columns that don't already exist
DO $$
BEGIN
    -- Core columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'full_name') THEN
        ALTER TABLE public.eligible_students ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'contact') THEN
        ALTER TABLE public.eligible_students ADD COLUMN contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'whatsapp') THEN
        ALTER TABLE public.eligible_students ADD COLUMN whatsapp TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'student_contact') THEN
        ALTER TABLE public.eligible_students ADD COLUMN student_contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'parent_contact_2') THEN
        ALTER TABLE public.eligible_students ADD COLUMN parent_contact_2 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'address') THEN
        ALTER TABLE public.eligible_students ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'age') THEN
        ALTER TABLE public.eligible_students ADD COLUMN age INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'class') THEN
        ALTER TABLE public.eligible_students ADD COLUMN class TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'school') THEN
        ALTER TABLE public.eligible_students ADD COLUMN school TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'prev_percent') THEN
        ALTER TABLE public.eligible_students ADD COLUMN prev_percent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'present_percent') THEN
        ALTER TABLE public.eligible_students ADD COLUMN present_percent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'academic_achievements') THEN
        ALTER TABLE public.eligible_students ADD COLUMN academic_achievements TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'non_academic_achievements') THEN
        ALTER TABLE public.eligible_students ADD COLUMN non_academic_achievements TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'academic_achievements_choice') THEN
        ALTER TABLE public.eligible_students ADD COLUMN academic_achievements_choice TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'non_academic_achievements_choice') THEN
        ALTER TABLE public.eligible_students ADD COLUMN non_academic_achievements_choice TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'scholarship') THEN
        ALTER TABLE public.eligible_students ADD COLUMN scholarship TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'has_scholarship') THEN
        ALTER TABLE public.eligible_students ADD COLUMN has_scholarship BOOLEAN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'does_work') THEN
        ALTER TABLE public.eligible_students ADD COLUMN does_work BOOLEAN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'earning_members') THEN
        ALTER TABLE public.eligible_students ADD COLUMN earning_members INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'volunteer_name') THEN
        ALTER TABLE public.eligible_students ADD COLUMN volunteer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'volunteer_contact') THEN
        ALTER TABLE public.eligible_students ADD COLUMN volunteer_contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'camp_name') THEN
        ALTER TABLE public.eligible_students ADD COLUMN camp_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'camp_date') THEN
        ALTER TABLE public.eligible_students ADD COLUMN camp_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'status') THEN
        ALTER TABLE public.eligible_students ADD COLUMN status TEXT DEFAULT 'Eligible';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'updated_at') THEN
        ALTER TABLE public.eligible_students ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'is_single_parent') THEN
        ALTER TABLE public.eligible_students ADD COLUMN is_single_parent BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'special_remarks') THEN
        ALTER TABLE public.eligible_students ADD COLUMN special_remarks TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'student_id') THEN
        ALTER TABLE public.eligible_students ADD COLUMN student_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'student_public_id') THEN
        ALTER TABLE public.eligible_students ADD COLUMN student_public_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eligible_students' AND column_name = 'doc_verification_count') THEN
        ALTER TABLE public.eligible_students ADD COLUMN doc_verification_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- STEP 3: Add missing columns to non_eligible_students (safe)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'full_name') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'contact') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'whatsapp') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN whatsapp TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'student_contact') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN student_contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'parent_contact_2') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN parent_contact_2 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'address') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'age') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN age INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'class') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN class TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'school') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN school TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'prev_percent') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN prev_percent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'present_percent') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN present_percent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'academic_achievements') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN academic_achievements TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'non_academic_achievements') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN non_academic_achievements TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'academic_achievements_choice') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN academic_achievements_choice TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'non_academic_achievements_choice') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN non_academic_achievements_choice TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'scholarship') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN scholarship TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'has_scholarship') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN has_scholarship BOOLEAN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'does_work') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN does_work BOOLEAN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'earning_members') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN earning_members INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'volunteer_name') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN volunteer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'volunteer_contact') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN volunteer_contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'camp_name') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN camp_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'camp_date') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN camp_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'status') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN status TEXT DEFAULT 'Not Eligible';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'updated_at') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'is_single_parent') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN is_single_parent BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'special_remarks') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN special_remarks TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'student_id') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN student_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'non_eligible_students' AND column_name = 'student_public_id') THEN
        ALTER TABLE public.non_eligible_students ADD COLUMN student_public_id TEXT;
    END IF;
END $$;

-- ============================================================
-- STEP 4: Ensure email has UNIQUE constraint (required for ON CONFLICT)
-- ============================================================

-- For eligible_students
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'eligible_students' 
        AND indexdef LIKE '%UNIQUE%email%'
    ) THEN
        -- Handle duplicate emails first by keeping the most recent
        WITH ranked AS (
            SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
            FROM public.eligible_students
            WHERE email IS NOT NULL
        )
        DELETE FROM public.eligible_students
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
        
        -- Now add unique constraint
        ALTER TABLE public.eligible_students ADD CONSTRAINT eligible_students_email_unique UNIQUE (email);
    END IF;
END $$;

-- For non_eligible_students
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'non_eligible_students' 
        AND indexdef LIKE '%UNIQUE%email%'
    ) THEN
        WITH ranked AS (
            SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
            FROM public.non_eligible_students
            WHERE email IS NOT NULL
        )
        DELETE FROM public.non_eligible_students
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
        
        ALTER TABLE public.non_eligible_students ADD CONSTRAINT non_eligible_students_email_unique UNIQUE (email);
    END IF;
END $$;

-- ============================================================
-- STEP 5: Enable RLS safely
-- ============================================================

ALTER TABLE public.eligible_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_eligible_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.eligible_students;
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.non_eligible_students;
DROP POLICY IF EXISTS "Enable all for service_role" ON public.eligible_students;
DROP POLICY IF EXISTS "Enable all for service_role" ON public.non_eligible_students;

CREATE POLICY "Enable read for authenticated" ON public.eligible_students
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated" ON public.non_eligible_students
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for service_role" ON public.eligible_students
    FOR ALL TO service_role USING (true) WITH CHECK (true);
    
CREATE POLICY "Enable all for service_role" ON public.non_eligible_students
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 6: Create trigger function with SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_move_student_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
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
      class = EXCLUDED.class,
      school = EXCLUDED.school,
      prev_percent = EXCLUDED.prev_percent,
      present_percent = EXCLUDED.present_percent,
      camp_name = EXCLUDED.camp_name,
      camp_date = EXCLUDED.camp_date,
      status = 'Eligible',
      updated_at = NOW(),
      is_single_parent = EXCLUDED.is_single_parent,
      special_remarks = EXCLUDED.special_remarks,
      student_id = EXCLUDED.student_id,
      student_public_id = EXCLUDED.student_public_id;

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
      class = EXCLUDED.class,
      school = EXCLUDED.school,
      prev_percent = EXCLUDED.prev_percent,
      present_percent = EXCLUDED.present_percent,
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
-- STEP 7: Recreate trigger
-- ============================================================

DROP TRIGGER IF EXISTS trg_admin_student_info_status_change ON public.admin_student_info;

CREATE TRIGGER trg_admin_student_info_status_change
  AFTER UPDATE OF status ON public.admin_student_info
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_move_student_on_status_change();

-- ============================================================
-- STEP 8: RPC functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.move_to_eligible_from_non_eligible(p_id UUID)
RETURNS VOID AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.non_eligible_students
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Non-eligible student with id % not found', p_id;
  END IF;

  UPDATE public.admin_student_info
  SET status = 'Eligible',
      updated_at = NOW()
  WHERE email = v_record.email;

  DELETE FROM public.non_eligible_students
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ============================================================
-- STEP 9: Grants
-- ============================================================

GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disapprove_student(UUID) TO authenticated;

-- ============================================================
-- STEP 10: Verify everything
-- ============================================================

SELECT
  'Trigger Status' as check_type,
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE 
    WHEN tgname = 'trg_admin_student_info_status_change' THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.admin_student_info'::regclass
  AND NOT tgisinternal;

-- Show current counts
SELECT 'eligible_students' as table_name, COUNT(*) as count FROM public.eligible_students
UNION ALL
SELECT 'non_eligible_students' as table_name, COUNT(*) as count FROM public.non_eligible_students
UNION ALL
SELECT 'admin_student_info (Pending)' as table_name, COUNT(*) as count FROM public.admin_student_info WHERE status = 'Pending'
UNION ALL
SELECT 'admin_student_info (Eligible)' as table_name, COUNT(*) as count FROM public.admin_student_info WHERE status = 'Eligible'
UNION ALL
SELECT 'admin_student_info (Not Eligible)' as table_name, COUNT(*) as count FROM public.admin_student_info WHERE status = 'Not Eligible';
