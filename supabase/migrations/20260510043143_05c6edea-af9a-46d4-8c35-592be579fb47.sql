-- The columns total_marks and letter_grade on public.student_grades are
-- GENERATED ALWAYS columns (Postgres computes them from the four mark columns).
-- A previous migration added a BEFORE INSERT/UPDATE trigger that also tried to
-- assign NEW.total_marks / NEW.letter_grade, which Postgres rejects with
-- "column ... can only be updated to DEFAULT" — breaking every grade save.
-- Drop the trigger and the now-unused function.
DROP TRIGGER IF EXISTS trg_student_grades_compute_totals ON public.student_grades;
DROP FUNCTION IF EXISTS public.student_grades_compute_totals();