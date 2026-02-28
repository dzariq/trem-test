-- Allow parents to view their child's sport house
CREATE POLICY "Parents can view child sport houses"
ON public.student_sport_houses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = student_sport_houses.student_id
      AND sg.guardian_user_id = auth.uid()
  )
);