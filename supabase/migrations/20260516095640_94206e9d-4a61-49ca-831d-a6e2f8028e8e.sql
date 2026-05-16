CREATE OR REPLACE FUNCTION public.notify_parent_on_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guardian_user_id uuid;
  v_student_name text;
  v_title text := 'Attendance marked';
  v_message text;
  v_date_display text;
  v_status text;
  v_dedupe_key text;
BEGIN
  v_status := lower(COALESCE(NEW.status, ''));

  SELECT name INTO v_student_name FROM public.students WHERE id = NEW.student_id;
  IF v_student_name IS NULL OR btrim(v_student_name) = '' THEN
    v_student_name := COALESCE(NEW.student_name, 'Student');
  END IF;

  v_date_display := to_char(NEW.date::date, 'DD Mon YYYY');

  v_message := CASE v_status
    WHEN 'present' THEN v_student_name || ' is present on ' || v_date_display
    WHEN 'absent'  THEN v_student_name || ' was absent on ' || v_date_display
    WHEN 'late'    THEN v_student_name || ' arrived late on ' || v_date_display
    WHEN 'excused' THEN v_student_name || ' is excused on ' || v_date_display
    ELSE v_student_name || ' attendance: ' || initcap(COALESCE(NEW.status, 'marked')) || ' on ' || v_date_display
  END;

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
      is_read = false,
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;