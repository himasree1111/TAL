-- Safe RPC function for auto-populating fee_tracking
-- Call from Edge Function or Admin UI

CREATE OR REPLACE FUNCTION populate_fee_tracking_safe()
RETURNS json AS $$
DECLARE
  result json;
  inserted_count int;
BEGIN
  -- Insert new students with ALL non-fee documents verified
  INSERT INTO fee_tracking (
    student_form_id, student_public_id, email, student_name, 
    education, school, branch, whatsapp_number, camp_name, camp_date,
    total_educational_expenses, fee_paid_by_tal, created_at, updated_at
  )
  SELECT 
    s.id, s.student_public_id, s.email, s.full_name,
    COALESCE(s.educationcategory, s.class, '') as education,
    s.school, s.branch, s.whatsapp, s.camp_name, s.camp_date,
    COALESCE(s.total_educational_expenses, 0), 0, NOW(), NOW()
  FROM student_form_submissions s
  WHERE NOT EXISTS (
    SELECT 1 FROM fee_tracking ft WHERE ft.student_form_id = s.id
  )
  AND s.id IN (
    SELECT sd.student_id
    FROM student_documents sd
    WHERE sd.category IN ('academic', 'personal', 'extracurricular')
      AND sd.category != ALL(ARRAY['fee_receipt', 'voucher'])
      AND sd.is_checked = true
    GROUP BY sd.student_id
    HAVING COUNT(DISTINCT sd.category) = 3  -- All 3 categories present & verified
       AND bool_and(sd.is_checked) = true
  )
  ON CONFLICT (student_form_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Return stats
  SELECT json_build_object(
    'inserted_count', inserted_count,
    'total_fee_tracking', (SELECT COUNT(*)::int FROM fee_tracking),
    'newly_ready_for_fee', inserted_count
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated/service_role
GRANT EXECUTE ON FUNCTION populate_fee_tracking_safe() TO authenticated, service_role;

-- Test call:
-- SELECT populate_fee_tracking_safe();

