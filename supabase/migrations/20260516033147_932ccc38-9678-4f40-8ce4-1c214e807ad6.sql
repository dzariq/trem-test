-- Notify users when a new announcement is published.
-- Fires on INSERT when status='published' OR on UPDATE when status transitions to 'published'.
-- Audience derived from announcements.target_roles ('parent', 'teacher', 'all').
-- Campus respected via announcements.campus_code (NULL = all campuses).

CREATE OR REPLACE FUNCTION public.notify_users_on_announcement_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r record;
  v_roles text[];
  v_parent_link text := '/parent/announcements/' || NEW.id::text;
  v_teacher_link text := '/teacher/announcements';
  v_excerpt text;
  v_dedupe_key text;
BEGIN
  -- Only act on published, active announcements
  IF lower(COALESCE(NEW.status, '')) <> 'published' OR NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  -- On UPDATE: only fire when transitioning into published, or when title/content change
  IF TG_OP = 'UPDATE' THEN
    IF lower(COALESCE(OLD.status,'')) = 'published'
       AND OLD.is_active = NEW.is_active
       AND OLD.title = NEW.title
       AND OLD.content = NEW.content THEN
      RETURN NEW;
    END IF;
  END IF;

  v_roles := COALESCE(NEW.target_roles, ARRAY[]::text[]);

  -- Build a short excerpt (first 140 chars, strip tags)
  v_excerpt := regexp_replace(COALESCE(NEW.content, ''), '<[^>]+>', '', 'g');
  v_excerpt := btrim(v_excerpt);
  IF length(v_excerpt) > 140 THEN
    v_excerpt := substr(v_excerpt, 1, 140) || '…';
  END IF;

  FOR r IN
    SELECT up.user_id, up.role
    FROM public.user_profiles up
    LEFT JOIN public.campuses c ON c.id = up.assigned_campus_id
    WHERE up.is_active = true
      AND up.user_id IS NOT NULL
      AND up.role IN ('parent', 'teacher')
      AND (
        'all' = ANY(v_roles)
        OR up.role = ANY(v_roles)
      )
      AND (
        NEW.campus_code IS NULL
        OR c.campus_code = NEW.campus_code
      )
  LOOP
    v_dedupe_key := 'announcement:' || NEW.id::text || ':' || r.user_id::text;

    INSERT INTO public.notifications (
      user_id, type, title, message, link_to, is_read,
      target_audience, source_key, dedupe_key, created_at, updated_at
    ) VALUES (
      r.user_id,
      'announcement',
      NEW.title,
      COALESCE(NULLIF(v_excerpt, ''), 'New announcement'),
      CASE WHEN r.role = 'teacher' THEN v_teacher_link ELSE v_parent_link END,
      false,
      CASE WHEN r.role = 'teacher' THEN 'teacher' ELSE 'parent' END,
      v_dedupe_key,
      v_dedupe_key,
      now(),
      now()
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
$fn$;

DROP TRIGGER IF EXISTS trg_notify_users_on_announcement_published ON public.announcements;
CREATE TRIGGER trg_notify_users_on_announcement_published
AFTER INSERT OR UPDATE OF status, is_active, title, content ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_on_announcement_published();