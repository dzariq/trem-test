
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
  v_has_text boolean;
BEGIN
  v_has_marks := COALESCE(NEW.attitude_marks,0) + COALESCE(NEW.homework_marks,0)
                + COALESCE(NEW.quiz_marks,0) + COALESCE(NEW.exam_marks,0) > 0;
  v_has_text := COALESCE(NEW.teacher_comment,'') <> ''
             OR COALESCE(NEW.subject_comment,'') <> ''
             OR COALESCE(NEW.study_recommendation,'') <> '';

  IF NOT v_has_marks AND NOT v_has_text THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.attitude_marks IS NOT DISTINCT FROM OLD.attitude_marks
       AND NEW.homework_marks IS NOT DISTINCT FROM OLD.homework_marks
       AND NEW.quiz_marks IS NOT DISTINCT FROM OLD.quiz_marks
       AND NEW.exam_marks IS NOT DISTINCT FROM OLD.exam_marks
       AND NEW.letter_grade IS NOT DISTINCT FROM OLD.letter_grade
       AND NEW.teacher_comment IS NOT DISTINCT FROM OLD.teacher_comment
       AND NEW.subject_comment IS NOT DISTINCT FROM OLD.subject_comment
       AND NEW.study_recommendation IS NOT DISTINCT FROM OLD.study_recommendation THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT name INTO v_student_name FROM public.students WHERE id = NEW.student_id;
  SELECT name INTO v_subject_name FROM public.subjects WHERE id = NEW.subject_id;
  SELECT name INTO v_period_name FROM public.academic_periods WHERE id = NEW.academic_period_id;

  FOR v_parent IN
    SELECT DISTINCT p.parent_user_id
    FROM public.student_parent sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE sp.student_id = NEW.student_id
      AND p.parent_user_id IS NOT NULL
  LOOP
    v_dedupe := 'grade:' || v_parent.parent_user_id::text
              || ':' || NEW.student_id::text
              || ':' || NEW.subject_id::text
              || ':' || NEW.academic_period_id::text;

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
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'notify_parents_on_grade_entry error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Backfill existing grade dedupe_keys to the new per-parent format
UPDATE public.notifications
SET dedupe_key = 'grade:' || user_id::text || ':' || substring(dedupe_key from 7),
    source_key = 'grade:' || user_id::text || ':' || substring(source_key from 7)
WHERE type = 'grade'
  AND dedupe_key LIKE 'grade:%'
  AND dedupe_key NOT LIKE 'grade:' || user_id::text || ':%';
