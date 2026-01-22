-- Add target_audience column to notifications to scope who can see them
ALTER TABLE public.notifications
ADD COLUMN target_audience TEXT NOT NULL DEFAULT 'all';

-- Add COMMENT explaining the column values
COMMENT ON COLUMN public.notifications.target_audience IS 'Controls who can see the notification: "all" (everyone), "teacher" (teachers only), "parent" (parents only), "student" (students only)';

-- Create a security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = check_role
  )
$$;

-- Create function to check if user is a parent of a linked student
CREATE OR REPLACE FUNCTION public.is_parent_of_student(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = p_student_id
    AND sg.guardian_user_id = auth.uid()
  )
$$;

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create new SELECT policy with audience filtering
-- Users can see notifications where:
-- 1. They are the recipient (user_id = auth.uid()) 
-- 2. AND audience matches their role (or is 'all')
CREATE POLICY "Users can view their scoped notifications"
ON public.notifications
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    target_audience = 'all'
    OR (target_audience = 'teacher' AND user_has_role('teacher'))
    OR (target_audience = 'parent' AND user_has_role('parent'))
    OR (target_audience = 'student' AND user_has_role('student'))
  )
);

-- Update existing notifications to have 'all' as default (already done via column default)
-- No data migration needed since new column has default value