-- 1) Trigger to auto-compute total_marks and letter_grade on student_grades
CREATE OR REPLACE FUNCTION public.student_grades_compute_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total integer;
BEGIN
  v_total := COALESCE(NEW.attitude_marks,0)
           + COALESCE(NEW.homework_marks,0)
           + COALESCE(NEW.quiz_marks,0)
           + COALESCE(NEW.exam_marks,0);

  NEW.total_marks := v_total;

  NEW.letter_grade := CASE
    WHEN v_total >= 90 THEN 'A*'
    WHEN v_total >= 80 THEN 'A'
    WHEN v_total >= 70 THEN 'B'
    WHEN v_total >= 60 THEN 'C'
    WHEN v_total >= 50 THEN 'D'
    ELSE 'E'
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_grades_compute_totals ON public.student_grades;
CREATE TRIGGER trg_student_grades_compute_totals
BEFORE INSERT OR UPDATE OF attitude_marks, homework_marks, quiz_marks, exam_marks
ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.student_grades_compute_totals();

-- 2) Backfill existing rows so parent report cards stop seeing NULL
UPDATE public.student_grades
SET attitude_marks = attitude_marks
WHERE total_marks IS NULL OR letter_grade IS NULL;

-- 3) Drop the redundant duplicate UNIQUE constraint
-- (two identical unique constraints currently exist on the same columns)
ALTER TABLE public.student_grades
  DROP CONSTRAINT IF EXISTS student_grades_unique;