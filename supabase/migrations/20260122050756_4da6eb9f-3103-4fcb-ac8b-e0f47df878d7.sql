-- Create security definer function to check if teacher can manage CCA sessions
-- Returns true if teacher is assigned as PIC (role='PIC' or is_primary=true) for the given activity
CREATE OR REPLACE FUNCTION public.can_manage_cca_sessions(p_activity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cca_activity_teachers
    WHERE activity_id = p_activity_id
      AND teacher_user_id = auth.uid()
      AND (role = 'PIC' OR is_primary = true)
  )
$$;

-- Drop any existing INSERT/UPDATE/DELETE policies on cca_sessions that might conflict
DROP POLICY IF EXISTS "Teachers can insert sessions for their CCAs" ON public.cca_sessions;
DROP POLICY IF EXISTS "Teachers can update sessions for their CCAs" ON public.cca_sessions;
DROP POLICY IF EXISTS "Teachers can delete sessions for their CCAs" ON public.cca_sessions;
DROP POLICY IF EXISTS "PIC teachers can insert sessions" ON public.cca_sessions;
DROP POLICY IF EXISTS "PIC teachers can update sessions" ON public.cca_sessions;
DROP POLICY IF EXISTS "PIC teachers can delete sessions" ON public.cca_sessions;

-- Create INSERT policy for PIC teachers
CREATE POLICY "PIC teachers can insert sessions"
ON public.cca_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_like()
  OR public.can_manage_cca_sessions(activity_id)
);

-- Create UPDATE policy for PIC teachers
CREATE POLICY "PIC teachers can update sessions"
ON public.cca_sessions
FOR UPDATE
TO authenticated
USING (
  public.is_admin_like()
  OR public.can_manage_cca_sessions(activity_id)
)
WITH CHECK (
  public.is_admin_like()
  OR public.can_manage_cca_sessions(activity_id)
);

-- Create DELETE policy for PIC teachers
CREATE POLICY "PIC teachers can delete sessions"
ON public.cca_sessions
FOR DELETE
TO authenticated
USING (
  public.is_admin_like()
  OR public.can_manage_cca_sessions(activity_id)
);