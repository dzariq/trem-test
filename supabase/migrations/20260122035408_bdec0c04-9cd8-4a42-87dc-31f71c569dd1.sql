-- Drop restrictive policies on cca_activities that may be blocking access
DROP POLICY IF EXISTS "Teachers can view CCA activities" ON public.cca_activities;
DROP POLICY IF EXISTS "Parents can view CCA activities" ON public.cca_activities;

-- Create a permissive policy for teachers to view ALL active CCA activities
CREATE POLICY "Teachers can view all active CCA activities"
ON public.cca_activities
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND is_active = true
);

-- Create a permissive policy for parents to view ALL active CCA activities
-- (year_level filtering is done in application code)
CREATE POLICY "Parents can view all active CCA activities"
ON public.cca_activities
FOR SELECT
TO authenticated
USING (
  public.is_parent() AND is_active = true
);

-- Also ensure cca_sessions are readable for browsing
DROP POLICY IF EXISTS "Teachers can view CCA sessions" ON public.cca_sessions;
DROP POLICY IF EXISTS "Parents can view CCA sessions" ON public.cca_sessions;

CREATE POLICY "Teachers can view all CCA sessions"
ON public.cca_sessions
FOR SELECT
TO authenticated
USING (
  public.is_teacher()
);

CREATE POLICY "Parents can view all CCA sessions"
ON public.cca_sessions
FOR SELECT
TO authenticated
USING (
  public.is_parent()
);

-- Ensure cca_activity_teachers are readable by parents (for PIC display)
DROP POLICY IF EXISTS "Parents can view PIC teachers" ON public.cca_activity_teachers;

CREATE POLICY "Parents can view all PIC teachers"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_parent()
);

-- Also update teachers policy to allow viewing ALL PICs (not just their own activities)
DROP POLICY IF EXISTS "Teachers can view all PICs for their activities" ON public.cca_activity_teachers;

CREATE POLICY "Teachers can view all PIC teachers"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_teacher()
);