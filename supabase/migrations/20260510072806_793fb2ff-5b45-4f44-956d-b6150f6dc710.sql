
-- 1) Backfill: for each announcement with no primary image attachment,
-- copy the primary image row from a sibling announcement (same title,
-- created within 5 seconds, different campus). Reuses the same storage_path
-- so no file duplication.
INSERT INTO public.announcement_attachments
  (announcement_id, file_name, file_url, file_type, file_size, storage_path, is_primary)
SELECT
  target.id,
  src_att.file_name,
  src_att.file_url,
  src_att.file_type,
  src_att.file_size,
  src_att.storage_path,
  true
FROM public.announcements target
JOIN public.announcements src
  ON src.title = target.title
 AND src.campus_code IS DISTINCT FROM target.campus_code
 AND abs(extract(epoch FROM (src.created_at - target.created_at))) < 5
JOIN LATERAL (
  SELECT *
  FROM public.announcement_attachments a
  WHERE a.announcement_id = src.id
    AND a.is_primary = true
    AND lower(coalesce(a.file_type,'')) IN ('jpg','jpeg','png','webp','gif')
  ORDER BY a.created_at ASC
  LIMIT 1
) src_att ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcement_attachments x
  WHERE x.announcement_id = target.id
    AND x.is_primary = true
    AND lower(coalesce(x.file_type,'')) IN ('jpg','jpeg','png','webp','gif')
);

-- 2) Trigger function: mirror a primary image attachment to sibling-campus twin
CREATE OR REPLACE FUNCTION public.mirror_primary_image_to_sibling_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src_title text;
  src_created timestamptz;
  src_campus text;
  sibling record;
BEGIN
  -- Only mirror primary image covers
  IF NEW.is_primary IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF lower(coalesce(NEW.file_type,'')) NOT IN ('jpg','jpeg','png','webp','gif') THEN
    RETURN NEW;
  END IF;

  SELECT title, created_at, campus_code
    INTO src_title, src_created, src_campus
  FROM public.announcements
  WHERE id = NEW.announcement_id;

  IF src_title IS NULL THEN
    RETURN NEW;
  END IF;

  FOR sibling IN
    SELECT id FROM public.announcements
    WHERE title = src_title
      AND campus_code IS DISTINCT FROM src_campus
      AND abs(extract(epoch FROM (created_at - src_created))) < 5
      AND id <> NEW.announcement_id
  LOOP
    -- Skip if sibling already has a primary image
    IF NOT EXISTS (
      SELECT 1 FROM public.announcement_attachments
      WHERE announcement_id = sibling.id
        AND is_primary = true
        AND lower(coalesce(file_type,'')) IN ('jpg','jpeg','png','webp','gif')
    ) THEN
      INSERT INTO public.announcement_attachments
        (announcement_id, file_name, file_url, file_type, file_size, storage_path, is_primary)
      VALUES
        (sibling.id, NEW.file_name, NEW.file_url, NEW.file_type, NEW.file_size, NEW.storage_path, true);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_primary_image_to_sibling
  ON public.announcement_attachments;

CREATE TRIGGER trg_mirror_primary_image_to_sibling
AFTER INSERT ON public.announcement_attachments
FOR EACH ROW
EXECUTE FUNCTION public.mirror_primary_image_to_sibling_announcement();
