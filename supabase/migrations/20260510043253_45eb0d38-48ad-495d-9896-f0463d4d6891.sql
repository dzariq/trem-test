-- Replace the generated letter_grade expression so the DB scale matches the UI
-- (A*/A/B/C/D/E) used in ReportCardDialog, AcademicPage, ResultsSummary, etc.
-- We must drop and re-add because Postgres does not allow altering the
-- expression of a generated column in place on this version.
ALTER TABLE public.student_grades DROP COLUMN IF EXISTS letter_grade;

ALTER TABLE public.student_grades
  ADD COLUMN letter_grade text
  GENERATED ALWAYS AS (
    CASE
      WHEN (attitude_marks + homework_marks + quiz_marks + exam_marks) >= 90 THEN 'A*'
      WHEN (attitude_marks + homework_marks + quiz_marks + exam_marks) >= 80 THEN 'A'
      WHEN (attitude_marks + homework_marks + quiz_marks + exam_marks) >= 70 THEN 'B'
      WHEN (attitude_marks + homework_marks + quiz_marks + exam_marks) >= 60 THEN 'C'
      WHEN (attitude_marks + homework_marks + quiz_marks + exam_marks) >= 50 THEN 'D'
      ELSE 'E'
    END
  ) STORED;