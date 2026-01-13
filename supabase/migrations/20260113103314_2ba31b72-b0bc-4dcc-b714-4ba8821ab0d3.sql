-- Allow parents to view cocurricular activities for their linked students
CREATE POLICY "Parents can view cocurricular activities for their linked students"
ON public.student_cocurricular_activities
FOR SELECT
TO authenticated
USING (
  is_parent() 
  AND EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = student_cocurricular_activities.student_id
    AND sg.guardian_user_id = auth.uid()
  )
);