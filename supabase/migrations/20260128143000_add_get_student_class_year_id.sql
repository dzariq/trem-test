-- Resolve class_year_id for a student with parent/teacher/admin access
CREATE OR REPLACE FUNCTION public.get_student_class_year_id(p_student_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cy.id
  FROM public.students s
  JOIN public.class_years cy
    ON upper(trim(cy.class_name)) = upper(trim(s.class))
  WHERE s.id = p_student_id
    AND (
      public.is_admin_like()
      OR public.is_teacher()
      OR EXISTS (
        SELECT 1
        FROM public.student_guardians sg
        WHERE sg.student_id = s.id
          AND sg.guardian_user_id = auth.uid()
      )
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_student_class_year_id(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_student_class_year_id(uuid) TO authenticated;
