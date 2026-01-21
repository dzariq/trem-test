-- Fix: Make can_write_grades SECURITY DEFINER so it can read academic_periods
-- without being blocked by RLS policies when called from student_grades RLS context

CREATE OR REPLACE FUNCTION public.can_write_grades(p_period_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin_like()
    OR EXISTS (
      SELECT 1
      FROM public.academic_periods ap
      WHERE ap.id = p_period_id
        AND ap.status = 'open'
    );
$$;