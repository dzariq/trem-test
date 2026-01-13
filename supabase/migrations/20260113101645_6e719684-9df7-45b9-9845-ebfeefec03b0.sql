-- Allow parents to view academic_periods
CREATE POLICY "Parents can view academic periods"
ON public.academic_periods
FOR SELECT
TO authenticated
USING (is_parent());