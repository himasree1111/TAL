-- Student public ID generation migration
-- Format: PREFIX-YYYY-### (example: SEC-2026-001)
-- Sequence scope: per camp prefix + year

BEGIN;

-- 1) Add generated public student ID column
ALTER TABLE public.student_form_submissions
ADD COLUMN IF NOT EXISTS student_public_id text;

-- 2) Counter table for per camp/year sequencing
CREATE TABLE IF NOT EXISTS public.student_public_id_counters (
  camp_prefix text NOT NULL,
  id_year integer NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_public_id_counters_pkey PRIMARY KEY (camp_prefix, id_year),
  CONSTRAINT student_public_id_counters_sequence_check CHECK (last_sequence >= 0)
);

-- 3) Unique index for generated IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_form_submissions_student_public_id
  ON public.student_form_submissions (student_public_id)
  WHERE student_public_id IS NOT NULL;

-- 4) Camp prefix normalizer using first 3 characters only
CREATE OR REPLACE FUNCTION public.get_student_camp_prefix(input_camp_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(trim(coalesce(input_camp_name, '')));

  -- Required behavior: prefix is first 3 characters of camp_name
  IF length(normalized) >= 3 THEN
    RETURN upper(substr(normalized, 1, 3));
  ELSIF length(normalized) > 0 THEN
    RETURN rpad(upper(normalized), 3, 'X');
  END IF;

  RETURN 'GEN';
END;
$$;

-- 5) Generate next student ID atomically
CREATE OR REPLACE FUNCTION public.next_student_public_id(input_camp_name text, input_created_at timestamp without time zone DEFAULT now())
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_camp_prefix text;
  v_generated_year integer;
  v_next_seq integer;
BEGIN
  v_camp_prefix := public.get_student_camp_prefix(input_camp_name);
  v_generated_year := EXTRACT(YEAR FROM coalesce(input_created_at, now()))::integer;

  INSERT INTO public.student_public_id_counters (camp_prefix, id_year, last_sequence)
  VALUES (v_camp_prefix, v_generated_year, 1)
  ON CONFLICT (camp_prefix, id_year)
  DO UPDATE
    SET last_sequence = public.student_public_id_counters.last_sequence + 1,
        updated_at = now()
  RETURNING last_sequence INTO v_next_seq;

  RETURN format('%s-%s-%s', v_camp_prefix, v_generated_year, lpad(v_next_seq::text, 3, '0'));
END;
$$;

-- 6) Trigger function for auto-generation on insert
CREATE OR REPLACE FUNCTION public.assign_student_public_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.student_public_id IS NULL OR btrim(NEW.student_public_id) = '' THEN
    NEW.student_public_id := public.next_student_public_id(NEW.camp_name, NEW.created_at);
  END IF;

  RETURN NEW;
END;
$$;

-- 7) Protect generated ID from accidental edits
CREATE OR REPLACE FUNCTION public.prevent_student_public_id_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow initial backfill from NULL/blank to generated value.
  IF OLD.student_public_id IS NULL OR btrim(OLD.student_public_id) = '' THEN
    RETURN NEW;
  END IF;

  IF OLD.student_public_id IS DISTINCT FROM NEW.student_public_id THEN
    RAISE EXCEPTION 'student_public_id is immutable once assigned';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_student_public_id ON public.student_form_submissions;
CREATE TRIGGER trg_assign_student_public_id
BEFORE INSERT ON public.student_form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.assign_student_public_id();

DROP TRIGGER IF EXISTS trg_prevent_student_public_id_update ON public.student_form_submissions;
CREATE TRIGGER trg_prevent_student_public_id_update
BEFORE UPDATE OF student_public_id ON public.student_form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_student_public_id_update();

-- 8) Backfill existing records in deterministic order
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT id, camp_name, created_at
    FROM public.student_form_submissions
    WHERE student_public_id IS NULL OR btrim(student_public_id) = ''
    ORDER BY created_at NULLS FIRST, id
  LOOP
    UPDATE public.student_form_submissions
    SET student_public_id = public.next_student_public_id(rec.camp_name, rec.created_at)
    WHERE id = rec.id;
  END LOOP;
END;
$$;

COMMIT;

-- Validation queries
-- 1. Check generated values
-- SELECT id, camp_name, created_at, student_public_id
-- FROM public.student_form_submissions
-- ORDER BY created_at DESC, id DESC
-- LIMIT 50;

-- 2. Check duplicates (should return 0)
-- SELECT COUNT(*) - COUNT(DISTINCT student_public_id)
-- FROM public.student_form_submissions
-- WHERE student_public_id IS NOT NULL;

-- 3. Check format compliance
-- SELECT student_public_id
-- FROM public.student_form_submissions
-- WHERE student_public_id IS NOT NULL
--   AND student_public_id !~ '^[A-Z]{3}-[0-9]{4}-[0-9]{3,}$';
