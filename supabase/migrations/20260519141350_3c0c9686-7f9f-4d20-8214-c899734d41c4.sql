-- Allow authenticated users (parents, students, teachers, admins) to read non-sensitive venue fields
-- so that CCA detail / session sheets can show the venue image when a venue is tagged.

CREATE POLICY "Authenticated can read venue basics"
  ON public.venues
  FOR SELECT
  TO authenticated
  USING (true);

-- Tighten column-level grants: hide sensitive columns (pic_phone, pic_name, location_notes,
-- pic_user_id, eligible_year_groups, venue_group_id, tags) from authenticated/anon callers.
REVOKE SELECT ON public.venues FROM authenticated, anon;
GRANT SELECT (
  id,
  name,
  image_url,
  venue_type,
  campus_code,
  capacity,
  is_active,
  venue_scope
) ON public.venues TO authenticated;
