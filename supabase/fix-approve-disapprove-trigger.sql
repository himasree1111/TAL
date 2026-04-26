-- ============================================================
-- FIX: Approve/Disapprove Status Update Trigger
-- ============================================================
-- Problem: When admin approves/disapproves a student in Manage
-- Beneficiaries, the status column in admin_student_info was not
-- updating, and students remained visible in the pending list.
--
-- Root Cause: The frontend was using student.student_id (which is
-- the student_form_submissions.id, not admin_student_info.id) to
-- update the admin_student_info table, causing the UPDATE to match
-- zero rows.
--
-- This SQL ensures the trigger exists to auto-move students to
-- eligible_students / non_eligible_students tables when status
-- changes. The frontend fix uses the correct id column.
-- ============================================================

-- 1. Ensure admin_student_info has a status column with default 'Pending'
ALTER TABLE public.admin_student_info
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Update any NULL statuses to 'Pending'
UPDATE public.admin_student_info
SET status = 'Pending'
WHERE status IS NULL;

-- 2. Create or replace the trigger function to auto-move on status change
CREATE OR REPLACE FUNCTION public.trg_move_student_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'Eligible', insert into eligible_students
  IF NEW.status = 'Eligible' AND (OLD.status IS NULL OR OLD.status != 'Eligible') THEN
    INSERT INTO public.eligible_students (
      full_name, email, contact, whatsapp, student_contact,
      parent_contact_2, address, age, class, school, prev_percent, present_percent,
      academic_achievements, non_academic_achievements, scholarship, has_scholarship, does_work,
      earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
      status, created_at, updated_at, is_single_parent, special_remarks,
      student_id, student_public_id
    )
    VALUES (
      NEW.full_name, NEW.email, NEW.contact, NEW.whatsapp,
      NEW.student_contact, NEW.parent_contact_2, NEW.address, NEW.age, NEW.class,
      NEW.school, NEW.prev_percent, NEW.present_percent,
      NEW.academic_achievements, NEW.non_academic_achievements,
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

  -- When status changes to 'Not Eligible', insert into non_eligible_students
  ELSIF NEW.status = 'Not Eligible' AND (OLD.status IS NULL OR OLD.status != 'Not Eligible') THEN
    INSERT INTO public.non_eligible_students (
      full_name, email, contact, whatsapp, student_contact,
      parent_contact_2, address, age, class, school, prev_percent, present_percent,
      academic_achievements, non_academic_achievements,
      scholarship, has_scholarship, does_work,
      earning_members, volunteer_name, volunteer_contact, camp_name, camp_date,
      status, created_at, updated_at, is_single_parent, special_remarks,
      student_id, student_public_id
    )
    VALUES (
      NEW.full_name, NEW.email, NEW.contact, NEW.whatsapp,
      NEW.student_contact, NEW.parent_contact_2, NEW.address, NEW.age, NEW.class,
      NEW.school, NEW.prev_percent, NEW.present_percent,
      NEW.academic_achievements, NEW.non_academic_achievements,
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
$$ LANGUAGE plpgsql;

-- 3. Drop and recreate the trigger on admin_student_info
DROP TRIGGER IF EXISTS trg_admin_student_info_status_change ON public.admin_student_info;

CREATE TRIGGER trg_admin_student_info_status_change
  AFTER UPDATE OF status ON public.admin_student_info
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_move_student_on_status_change();

-- 4. Verify trigger exists
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.admin_student_info'::regclass
  AND NOT tgisinternal;

-- 5. Also ensure the move_to_eligible_from_non_eligible RPC exists
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
  -- and we delete from non_eligible_students
  DELETE FROM public.non_eligible_students
  WHERE id = p_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.move_to_eligible_from_non_eligible(UUID) TO service_role;

-- 6. Verify admin_student_info has correct id column (primary key)
-- The frontend now uses student.id (admin_student_info.id) for updates
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_student_info'
ORDER BY ordinal_position;

