
CREATE OR REPLACE FUNCTION public.notify_parents_on_grade_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name text;
  v_subject_name text;
  v_period_name text;
  v_parent record;
  v_dedupe text;
  v_link text := '/parent/academic';
  v_has_marks boolean;
BEGIN
  v_has_marks := COALESCE(NEW.attitude_marks,0) + COALESCE(NEW.homework_marks,0)
                + COALESCE(NEW.quiz_marks,0) + COALESCE(NEW.exam_marks,0) > 0;
  IF NOT v_has_marks THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.attitude_marks IS NOT DISTINCT FROM OLD.attitude_marks
       AND NEW.homework_marks IS NOT DISTINCT FROM OLD.homework_marks
       AND NEW.quiz_marks IS NOT DISTINCT FROM OLD.quiz_marks
       AND NEW.exam_marks IS NOT DISTINCT FROM OLD.exam_marks
       AND NEW.letter_grade IS NOT DISTINCT FROM OLD.letter_grade THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT name INTO v_student_name FROM public.students WHERE id = NEW.student_id;
  SELECT name INTO v_subject_name FROM public.subjects WHERE id = NEW.subject_id;
  SELECT name INTO v_period_name FROM public.academic_periods WHERE id = NEW.academic_period_id;

  v_dedupe := 'grade:' || NEW.student_id::text || ':' || NEW.subject_id::text || ':' || NEW.academic_period_id::text;

  FOR v_parent IN
    SELECT DISTINCT p.parent_user_id
    FROM public.student_parent sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE sp.student_id = NEW.student_id
      AND p.parent_user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (
      user_id, title, message, type, link_to, target_audience, source_key, dedupe_key, is_read
    ) VALUES (
      v_parent.parent_user_id,
      '📊 Grade Released: ' || COALESCE(v_subject_name, 'Subject'),
      COALESCE(v_student_name, 'Your child') || ' received '
        || COALESCE(NEW.letter_grade, NEW.total_marks::text, 'a grade')
        || ' (' || COALESCE(NEW.total_marks::text, '—') || '/100) for '
        || COALESCE(v_subject_name, 'a subject')
        || ' — ' || COALESCE(v_period_name, 'this period') || '.',
      'grade',
      v_link,
      'parent',
      v_dedupe,
      v_dedupe,
      false
    )
    ON CONFLICT (dedupe_key) DO UPDATE
      SET title = EXCLUDED.title,
          message = EXCLUDED.message,
          is_read = false,
          updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_parents_on_grade_entry ON public.student_grades;
CREATE TRIGGER trg_notify_parents_on_grade_entry
AFTER INSERT OR UPDATE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.notify_parents_on_grade_entry();
