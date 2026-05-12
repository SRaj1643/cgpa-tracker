-- 1. Performance indexes
CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON public.semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_semesters_user_number ON public.semesters(user_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON public.subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON public.subjects(created_at);

-- 2. Normalize existing course codes (trim + uppercase, NULL out empties) so we can add the unique constraint
UPDATE public.subjects
SET course_code = NULLIF(UPPER(TRIM(course_code)), '')
WHERE course_code IS NOT NULL;

-- 3. De-duplicate any existing duplicate (semester_id, course_code) pairs by appending a suffix
WITH dups AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY semester_id, course_code
           ORDER BY created_at
         ) AS rn
  FROM public.subjects
  WHERE course_code IS NOT NULL
)
UPDATE public.subjects s
SET course_code = s.course_code || '-' || dups.rn
FROM dups
WHERE s.id = dups.id AND dups.rn > 1;

-- 4. Unique constraint (partial — only when course_code is set)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subjects_semester_course
  ON public.subjects(semester_id, course_code)
  WHERE course_code IS NOT NULL;

-- 5. Server-side SGPA helper (read-only, RLS-respected via the underlying SELECT)
CREATE OR REPLACE FUNCTION public.compute_sgpa(_semester_id uuid)
RETURNS TABLE (sgpa numeric, total_credits numeric, subject_count integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(credits * grade) / NULLIF(SUM(credits), 0), 0)::numeric AS sgpa,
    COALESCE(SUM(credits), 0)::numeric AS total_credits,
    COUNT(*)::int AS subject_count
  FROM public.subjects
  WHERE semester_id = _semester_id;
$$;

-- 6. Server-side CGPA helper for the current authenticated user
CREATE OR REPLACE FUNCTION public.compute_cgpa()
RETURNS TABLE (cgpa numeric, total_credits numeric, semester_count integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH per_sem AS (
    SELECT s.semester_id,
           SUM(s.credits * s.grade) AS weighted,
           SUM(s.credits) AS credits
    FROM public.subjects s
    WHERE s.user_id = auth.uid()
    GROUP BY s.semester_id
    HAVING SUM(s.credits) > 0
  )
  SELECT
    COALESCE(SUM(weighted) / NULLIF(SUM(credits), 0), 0)::numeric AS cgpa,
    COALESCE(SUM(credits), 0)::numeric AS total_credits,
    COUNT(*)::int AS semester_count
  FROM per_sem;
$$;