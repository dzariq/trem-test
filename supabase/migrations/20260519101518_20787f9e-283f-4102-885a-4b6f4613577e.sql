
-- 1) Column-level security on cca_activities: hide internal_notes / budget_* from non-admins
REVOKE SELECT ON public.cca_activities FROM authenticated;
GRANT SELECT (
  id, name, public_description, category, coordinator_name, coordinator_email,
  max_participants, year_levels, meeting_day, meeting_time, location, is_active,
  created_at, updated_at, classes_involved, location_id, allow_free_text,
  is_club, type_id, image_url, campus_code, kind, venue_id, archived, poster_url
) ON public.cca_activities TO authenticated;

-- Admins continue to read every column via service-side queries / RPCs.
-- (service_role retains full SELECT.)

-- 2) Stop publishing the enrollments table to realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.enrollments;
