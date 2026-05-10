-- 1. Skip "present" status from parent attendance notifications
CREATE OR REPLACE FUNCTION public.notify_parent_on_attendance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_guardian_user_id uuid;
  v_student_name text;
  v_title text := 'Attendance marked';
  v_message text;
  v_date_display text;
  v_status_label text;
  v_dedupe_key text;
BEGIN
  -- Only notify for non-present statuses (absent, late, excused)
  IF lower(COALESCE(NEW.status, '')) = 'present' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_student_name FROM public.students WHERE id = NEW.student_id;
  IF v_student_name IS NULL OR btrim(v_student_name) = '' THEN
    v_student_name := COALESCE(NEW.student_name, 'Student');
  END IF;

  v_date_display := to_char(NEW.date::date, 'DD Mon YYYY');
  v_status_label := initcap(COALESCE(NEW.status, 'absent'));
  v_message := v_student_name || ' is ' || v_status_label || ' on ' || v_date_display;

  FOR v_guardian_user_id IN
    SELECT DISTINCT sg.guardian_user_id
    FROM public.student_guardians sg
    JOIN public.user_profiles up
      ON up.user_id = sg.guardian_user_id
     AND up.is_active = true
    WHERE sg.student_id = NEW.student_id
  LOOP
    v_dedupe_key := 'attendance:' || NEW.student_id::text || ':' || NEW.date::text || ':' || v_guardian_user_id::text;

    INSERT INTO public.notifications (
      user_id, type, title, message, link_to, is_read,
      target_audience, source_key, dedupe_key, created_at, updated_at
    ) VALUES (
      v_guardian_user_id, 'attendance', v_title, v_message, '/parent/attendance', false,
      'parent', v_dedupe_key, v_dedupe_key, now(), now()
    )
    ON CONFLICT (dedupe_key)
    DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      type = EXCLUDED.type,
      link_to = EXCLUDED.link_to,
      target_audience = EXCLUDED.target_audience,
      source_key = EXCLUDED.source_key,
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2. Backfill campus_code for existing attendance rows from students
UPDATE public.attendance a
SET campus_code = s.campus_code
FROM public.students s
WHERE a.student_id = s.id
  AND a.campus_code IS NULL
  AND s.campus_code IS NOT NULL;