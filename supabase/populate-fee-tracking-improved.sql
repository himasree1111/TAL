-- Improved fee_tracking population function
-- This function automatically creates fee_tracking records for students 
-- whose documents have been verified
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION populate_fee_tracking_from_verified()
RETURNS json AS $$
DECLARE
  inserted_count int := 0;
  skipped_count int := 0;
  result json;
  rec record;
  total_expenses numeric(10, 2);
BEGIN
  -- Loop through all student_form_submissions with verified documents
  FOR rec IN
    SELECT DISTINCT
      s.id as student_form_id,
      s.student_public_id,
      s.full_name,
      s.first_name,
      s.email,
      s.whatsapp,
      s.contact,
      s.camp_name,
      s.camp_date,
      s.educationcategory,
      s.class,
      s.course,
      s.school,
      s.branch,
      s.fee,
      s.educational_expenses,
      s.total_educational_expenses
    FROM student_form_submissions s
    INNER JOIN student_documents sd ON s.id = sd.student_id
    WHERE sd.category IN ('academic', 'personal', 'extracurricular')
      AND sd.is_checked = true
      AND NOT EXISTS (
        SELECT 1 FROM fee_tracking ft WHERE ft.student_form_id = s.id
      )
    GROUP BY s.id
    HAVING COUNT(DISTINCT sd.category) >= 2  -- At least 2 categories verified
  LOOP
    -- Calculate total_educational_expenses
    -- Priority: 1. total_educational_expenses field, 2. fee field, 3. Sum from educational_expenses JSON
    
    total_expenses := COALESCE(rec.total_educational_expenses, 0);
    
    IF total_expenses = 0 AND rec.fee IS NOT NULL THEN
      total_expenses := rec.fee::numeric;
    END IF;
    
    IF total_expenses = 0 AND rec.educational_expenses IS NOT NULL THEN
      -- Extract sum from JSONB educational_expenses
      -- This is a simplified version - adjust based on your JSON structure
      total_expenses := 0;
    END IF;
    
    -- Insert into fee_tracking with exact schema
    INSERT INTO fee_tracking (
      student_form_id,
      student_public_id,
      student_name,
      email,
      whatsapp_number,
      camp_name,
      camp_date,
      education,
      school,
      branch,
      total_educational_expenses,
      fee_paid_by_tal,
      total_paid_by_tal,
      fee_status,
      voucher_url,
      created_at,
      updated_at
    ) VALUES (
      rec.student_form_id,
      COALESCE(rec.student_public_id, rec.student_form_id::text),
      COALESCE(rec.full_name, rec.first_name, 'Student'),
      rec.email,
      COALESCE(rec.whatsapp, rec.contact),
      rec.camp_name,
      rec.camp_date,
      COALESCE(rec.educationcategory, rec.class, rec.course),
      rec.school,
      rec.branch,
      total_expenses,
      0,
      0,
      'Pending',
      NULL,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    skipped_count := skipped_count + 1;
  END LOOP;

  -- Build result
  SELECT json_build_object(
    'success', true,
    'inserted_count', (SELECT COUNT(*)::int FROM fee_tracking WHERE created_at >= NOW() - INTERVAL '5 minutes'),
    'message', 'Fee tracking records populated successfully'
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION populate_fee_tracking_from_verified() TO authenticated, service_role;

-- Manual trigger for existing verified students
-- Run this once to populate fee_tracking for all currently verified students:
-- SELECT populate_fee_tracking_from_verified();

-- Verify the results:
-- SELECT student_public_id, student_name, email, total_educational_expenses, fee_status 
-- FROM fee_tracking 
-- ORDER BY created_at DESC 
-- LIMIT 10;
