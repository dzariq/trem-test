CREATE OR REPLACE FUNCTION public.notify_cca_session_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_name text;
  v_activity_kind text;
  v_activity_category text;
  v_date_text text;
  v_time_text text;
  v_kind_label text;
  v_type text;
  v_parent_msg text;
  v_teacher_msg text;
  v_is_sport boolean;
BEGIN
  SELECT name, kind, category
    INTO v_activity_name, v_activity_kind, v_activity_category
  FROM public.cca_activities
  WHERE id = NEW.activity_id;

  v_date_text := to_char(NEW.session_date, 'Dy, DD Mon');
  IF NEW.start_time IS NULL THEN
    v_time_text := 'All Day';
  ELSIF NEW.end_time IS NULL THEN
    v_time_text := to_char(NEW.start_time, 'HH12:MI AM');
  ELSE
    v_time_text := to_char(NEW.start_time, 'HH12:MI AM') || '–' || to_char(NEW.end_time, 'HH12:MI AM');
  END IF;

  v_is_sport := (
    COALESCE(lower(v_activity_kind), 'club') = 'club'
    AND (
      COALESCE(v_activity_name, '') ~* '(sport|football|basketball|swim|rugby|cricket|netball|athletic|tennis|badminton|volleyball)'
      OR COALESCE(v_activity_category, '') ~* 'sport'
    )
  );

  IF lower(COALESCE(v_activity_kind, 'club')) = 'outdoor' THEN
    v_kind_label := 'Outdoor';
    v_type := 'cca_outdoor';
  ELSIF lower(COALESCE(v_activity_kind, 'club')) = 'event' THEN
    v_kind_label := 'Event';
    v_type := 'cca_event';
  ELSIF v_is_sport THEN
    v_kind_label := 'Sport';
    v_type := 'cca_sport';
  ELSE
    v_kind_label := 'Club';
    v_type := 'cca_club';
  END IF;

  v_parent_msg  := 'New ' || v_kind_label || ' session · ' || v_date_text || ' · ' || v_time_text;
  v_teacher_msg := 'New ' || v_kind_label || ' session you''re leading · ' || v_date_text || ' · ' || v_time_text;

  INSERT INTO public.notifications (
    user_id, title, message, type, link_to, target_audience, source_key, dedupe_key, is_read
  )
  SELECT DISTINCT
    cat.teacher_user_id,
    COALESCE(v_activity_name, 'CCA Session'),
    v_teacher_msg,
    v_type,
    '/teacher/calendar',
    'teacher',
    'cca-session-teacher:' || NEW.id::text || ':' || cat.teacher_user_id::text,
    'cca-session-teacher:' || NEW.id::text || ':' || cat.teacher_user_id::text,
    false
  FROM public.cca_activity_teachers cat
  WHERE cat.activity_id = NEW.activity_id
    AND cat.teacher_user_id IS NOT NULL
  ON CONFLICT (dedupe_key) DO UPDATE
    SET title = EXCLUDED.title,
        message = EXCLUDED.message,
        type = EXCLUDED.type,
        is_read = false,
        updated_at = now();

  INSERT INTO public.notifications (
    user_id, title, message, type, link_to, target_audience, source_key, dedupe_key, is_read
  )
  SELECT DISTINCT
    sg.guardian_user_id,
    COALESCE(v_activity_name, 'CCA Session'),
    v_parent_msg,
    v_type,
    '/parent/calendar',
    'parent',
    'cca-session-parent:' || NEW.id::text || ':' || sg.guardian_user_id::text,
    'cca-session-parent:' || NEW.id::text || ':' || sg.guardian_user_id::text,
    false
  FROM public.student_cca_enrollments sce
  JOIN public.student_guardians sg ON sg.student_id = sce.student_id
  WHERE sce.cca_activity_id = NEW.activity_id
    AND sce.status IN ('enrolled', 'active')
    AND sg.guardian_user_id IS NOT NULL
  ON CONFLICT (dedupe_key) DO UPDATE
    SET title = EXCLUDED.title,
        message = EXCLUDED.message,
        type = EXCLUDED.type,
        is_read = false,
        updated_at = now();

  RETURN NEW;
END;
$$;