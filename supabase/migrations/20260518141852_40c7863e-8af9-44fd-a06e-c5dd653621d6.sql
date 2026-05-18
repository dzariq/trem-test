-- Remove sensitive tables from Supabase Realtime publication to prevent broad change broadcasts.
DO $$
DECLARE
  sensitive_table text;
BEGIN
  FOREACH sensitive_table IN ARRAY ARRAY[
    'student_grades',
    'students',
    'student_visa_records',
    'student_visa_history',
    'student_visa_documents'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = sensitive_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', sensitive_table);
    END IF;
  END LOOP;
END $$;

-- Prevent authenticated clients from selecting staff-only CCA fields.
REVOKE SELECT ON public.cca_activities FROM anon, authenticated;
GRANT SELECT (
  id,
  name,
  public_description,
  category,
  coordinator_name,
  coordinator_email,
  max_participants,
  year_levels,
  meeting_day,
  meeting_time,
  location,
  is_active,
  created_at,
  updated_at,
  classes_involved,
  location_id,
  allow_free_text,
  is_club,
  type_id,
  image_url,
  campus_code,
  kind,
  venue_id,
  archived,
  poster_url
) ON public.cca_activities TO anon, authenticated;
GRANT SELECT ON public.cca_activities TO service_role;

-- Prevent authenticated clients from selecting staff-only ticket notes.
REVOKE SELECT ON public.parent_tickets FROM anon, authenticated;
GRANT SELECT (
  id,
  sheet_row_id,
  ticket_type,
  status,
  parent_name,
  contact_number,
  parent_email,
  student_name,
  student_class,
  campus,
  subject,
  description,
  praise_template,
  show_on_wall,
  wall_consent,
  assigned_to,
  created_at,
  updated_at,
  resolved_at,
  attachments,
  campus_code
) ON public.parent_tickets TO anon, authenticated;
GRANT SELECT ON public.parent_tickets TO service_role;

-- Move CCA session notification fan-out to a validated database trigger.
CREATE OR REPLACE FUNCTION public.notify_cca_session_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_name text;
  v_date_text text;
  v_time_text text;
  v_message text;
BEGIN
  SELECT name INTO v_activity_name
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

  v_message := COALESCE(v_activity_name, 'CCA') || ' session scheduled for ' || v_date_text || ', ' || v_time_text || '.';

  INSERT INTO public.notifications (
    user_id, title, message, type, link_to, target_audience, source_key, dedupe_key, is_read
  )
  SELECT DISTINCT
    cat.teacher_user_id,
    'CCA Session Created',
    v_message,
    'cca',
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
        is_read = false,
        updated_at = now();

  INSERT INTO public.notifications (
    user_id, title, message, type, link_to, target_audience, source_key, dedupe_key, is_read
  )
  SELECT DISTINCT
    sg.guardian_user_id,
    'CCA Session Scheduled',
    v_message,
    'cca',
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
        is_read = false,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_cca_session_created ON public.cca_sessions;
CREATE TRIGGER trg_notify_cca_session_created
AFTER INSERT ON public.cca_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_cca_session_created();

-- Tighten notification creation policies.
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own role-scoped notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_like());

CREATE POLICY "Users can insert own role-scoped notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND target_audience = public.current_user_role()
);