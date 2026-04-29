-- One-time backfill: link existing auth.users to eligible_students by email
-- Run in Supabase SQL Editor as an admin.

UPDATE public.eligible_students AS es
SET auth_id = au.id
FROM auth.users AS au
WHERE es.auth_id IS NULL
  AND lower(es.email) = lower(au.email);

-- Verify pending rows still not linked
SELECT email
FROM public.eligible_students
WHERE auth_id IS NULL
ORDER BY email;

-- Targeted fix for a single student (optional)
-- Replace with target email if needed.
UPDATE public.eligible_students AS es
SET auth_id = au.id
FROM auth.users AS au
WHERE lower(es.email) = lower('srijanigajam@gmail.com')
  AND lower(au.email) = lower('srijanigajam@gmail.com');
