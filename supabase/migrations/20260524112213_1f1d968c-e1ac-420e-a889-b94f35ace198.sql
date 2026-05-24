
DROP POLICY IF EXISTS "Parents can view own student guardians" ON public.student_guardians;

CREATE POLICY "Parents can view own student guardians"
ON public.student_guardians
FOR SELECT
USING (
  auth.uid() = guardian_user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'parent'
    )
    OR public.has_role(auth.uid(), 'parent')
  )
);
