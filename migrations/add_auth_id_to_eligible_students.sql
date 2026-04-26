-- Migration: Add auth_id column to eligible_students table
-- This column stores the Supabase Auth user ID for proper authentication

ALTER TABLE public.eligible_students
ADD COLUMN auth_id uuid DEFAULT NULL,
ADD CONSTRAINT eligible_students_auth_id_unique UNIQUE (auth_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_eligible_students_auth_id 
  ON public.eligible_students(auth_id);

-- Create an index for email lookups
CREATE INDEX IF NOT EXISTS idx_eligible_students_email 
  ON public.eligible_students(email);
