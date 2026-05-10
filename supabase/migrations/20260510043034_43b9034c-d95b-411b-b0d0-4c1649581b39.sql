-- Re-touch all student_grades rows so the BEFORE UPDATE trigger
-- (student_grades_compute_totals) recomputes total_marks and letter_grade
-- consistently. Fixes legacy rows with stale letter_grade values like 'F'
-- that aren't part of the current scale (A*/A/B/C/D/E).
UPDATE public.student_grades SET updated_at = updated_at;