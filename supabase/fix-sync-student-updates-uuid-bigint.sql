-- Fix for: operator does not exist: uuid = bigint
-- Root cause: sync_student_updates compared eligible/non_eligible student_id (uuid)
-- against student_form_submissions.id (bigint).
--
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.sync_student_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- admin_student_info.student_id is bigint, so match with NEW.id (bigint)
  UPDATE admin_student_info
  SET
    full_name = NEW.full_name,
    age = NEW.age,
    camp_name = NEW.camp_name,
    camp_date = NEW.camp_date,
    school = NEW.school,
    prev_percent = NEW.prev_percent,
    present_percent = NEW.present_percent,
    class = NEW.class,
    email = NEW.email,
    contact = NEW.contact,
    parent_contact_2 = NEW.parent_contact_2,
    whatsapp = NEW.whatsapp,
    student_contact = NEW.student_contact,
    scholarship = NEW.scholarship,
    has_scholarship = NEW.has_scholarship,
    does_work = NEW.does_work,
    earning_members = NEW.earning_members,
    address = NEW.address,
    student_public_id = NEW.student_public_id,
    special_remarks = NEW.special_remarks
  WHERE student_id = NEW.id;

  -- eligible_students.student_id is uuid, so match with NEW.user_id (uuid)
  -- Fallback to email match for older records where student_id may be unset.
  UPDATE eligible_students
  SET
    full_name = NEW.full_name,
    age = NEW.age,
    school = NEW.school,
    class = NEW.class,
    email = NEW.email,
    contact = NEW.contact,
    student_public_id = NEW.student_public_id,
    special_remarks = NEW.special_remarks
  WHERE (NEW.user_id IS NOT NULL AND student_id = NEW.user_id)
     OR email = NEW.email;

  -- non_eligible_students.student_id is uuid, so match with NEW.user_id (uuid)
  -- Fallback to email match for older records where student_id may be unset.
  UPDATE non_eligible_students
  SET
    full_name = NEW.full_name,
    age = NEW.age,
    school = NEW.school,
    class = NEW.class,
    email = NEW.email,
    contact = NEW.contact,
    student_public_id = NEW.student_public_id,
    special_remarks = NEW.special_remarks
  WHERE (NEW.user_id IS NOT NULL AND student_id = NEW.user_id)
     OR email = NEW.email;

  RETURN NEW;
END;
$function$;
