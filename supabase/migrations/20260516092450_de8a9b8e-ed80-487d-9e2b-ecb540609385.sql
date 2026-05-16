DROP POLICY IF EXISTS "Scoped read calendar events" ON public.calendar_events;

CREATE POLICY "Scoped read calendar events" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin_like()
    OR created_by = auth.uid()::text
    OR (auth.uid() = ANY(COALESCE(visible_user_ids, ARRAY[]::uuid[])))
    OR (
      is_teacher()
      AND COALESCE(visibility, 'public') <> 'private'
      AND (
        student_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.students s
          JOIN public.teacher_assignments ta ON ta.class_year_id = s.class_year_id
          WHERE s.id = calendar_events.student_id
            AND ta.teacher_id = auth.uid()
        )
      )
    )
    OR (
      is_parent()
      AND COALESCE(visibility, 'public') = 'public'
      AND (
        student_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.student_guardians sg
          WHERE sg.student_id = calendar_events.student_id
            AND sg.guardian_user_id = auth.uid()
        )
      )
    )
  );