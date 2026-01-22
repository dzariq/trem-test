-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Teachers can view all PICs for their activities" ON public.cca_activity_teachers;

-- Create a SECURITY DEFINER function to check if teacher is assigned to an activity
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_cca(p_activity_id uuid)
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
  )
$$;

-- Recreate the policy using the function instead of self-referencing query
CREATE POLICY "Teachers can view all PICs for their activities"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND public.is_teacher_assigned_to_cca(activity_id)
);