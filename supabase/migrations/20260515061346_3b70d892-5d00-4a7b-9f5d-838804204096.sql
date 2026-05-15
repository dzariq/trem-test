CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.create_weekly_calendar_digest(p_week_start date DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_week_start date;
  v_week_end date;
  v_iso_week text;
  v_inserted integer := 0;
  r record;
  v_msg text;
  v_count integer;
  v_link text;
BEGIN
  v_week_start := COALESCE(
    p_week_start,
    (date_trunc('week', (now() AT TIME ZONE 'Asia/Kuala_Lumpur'))::date)
  );
  v_week_end := v_week_start + 6;
  v_iso_week := to_char(v_week_start, 'IYYY-"W"IW');

  FOR r IN
    SELECT
      up.user_id,
      up.role,
      c.campus_code AS user_campus_code
    FROM public.user_profiles up
    LEFT JOIN public.campuses c ON c.id = up.assigned_campus_id
    WHERE up.is_active = true
      AND up.role IN ('parent', 'teacher')
      AND up.user_id IS NOT NULL
  LOOP
    SELECT
      COUNT(*),
      string_agg(
        '• ' || to_char(ce.start_date AT TIME ZONE 'Asia/Kuala_Lumpur', 'Dy DD Mon') || ' — ' || ce.title,
        E'\n'
        ORDER BY ce.start_date
      )
    INTO v_count, v_msg
    FROM (
      SELECT *
      FROM public.calendar_events
      WHERE visibility IN ('public', 'all', 'everyone')
        AND (campus_code IS NULL OR campus_code = r.user_campus_code)
        AND start_date >= (v_week_start::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
        AND start_date <  ((v_week_end + 1)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
      ORDER BY start_date
      LIMIT 12
    ) ce;

    IF v_count IS NULL OR v_count = 0 THEN
      CONTINUE;
    END IF;

    v_link := CASE WHEN r.role = 'teacher' THEN '/teacher/calendar' ELSE '/parent/calendar' END;

    INSERT INTO public.notifications (
      user_id, title, message, type, link_to, is_read,
      target_audience, source_key, created_at, updated_at
    )
    VALUES (
      r.user_id,
      'This week at school',
      v_count || ' event' || CASE WHEN v_count = 1 THEN '' ELSE 's' END
        || ' (' || to_char(v_week_start, 'DD Mon') || ' – ' || to_char(v_week_end, 'DD Mon') || E'):\n' || v_msg,
      'weekly_digest',
      v_link,
      false,
      CASE WHEN r.role = 'teacher' THEN 'teacher' ELSE 'parent' END,
      'weekly-digest:' || v_iso_week || ':' || r.user_id::text,
      now(),
      now()
    )
    ON CONFLICT (source_key) DO UPDATE
      SET title = EXCLUDED.title,
          message = EXCLUDED.message,
          updated_at = now();

    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$fn$;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-calendar-digest');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'weekly-calendar-digest',
  '0 23 * * 0',
  $cron$ SELECT public.create_weekly_calendar_digest(); $cron$
);