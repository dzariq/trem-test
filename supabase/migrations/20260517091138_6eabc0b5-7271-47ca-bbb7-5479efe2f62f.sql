CREATE POLICY "Parents can view their children bukku_contacts"
ON public.bukku_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = bukku_contacts.student_id
      AND sg.guardian_user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view assigned-class bukku_contacts"
ON public.bukku_contacts
FOR SELECT
USING (
  is_teacher() AND EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.teacher_assignments ta ON ta.class_year_id = s.class_year_id
    WHERE s.id = bukku_contacts.student_id
      AND ta.teacher_id = auth.uid()
  )
);