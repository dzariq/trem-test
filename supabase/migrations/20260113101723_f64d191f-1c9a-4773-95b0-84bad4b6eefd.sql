-- Allow parents to view student_grades for their linked students
CREATE POLICY "Parents can view grades for their linked students"
ON public.student_grades
FOR SELECT
TO authenticated
USING (
  is_parent() 
  AND EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = student_grades.student_id
    AND sg.guardian_user_id = auth.uid()
  )
);

-- Allow parents to view subjects (public read for authenticated users)
CREATE POLICY "Parents can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (is_parent());