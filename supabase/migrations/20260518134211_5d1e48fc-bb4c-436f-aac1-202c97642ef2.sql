
CREATE POLICY "Admins can delete bug attachments"
  ON public.bug_report_attachments FOR DELETE
  TO authenticated
  USING (public.is_admin_like());

CREATE POLICY "Teachers can read session sport pics"
  ON public.cca_session_sport_pics FOR SELECT
  TO authenticated
  USING (public.user_has_role('teacher') OR public.is_admin_like());

CREATE POLICY "Parents can read sport pics for enrolled activities"
  ON public.cca_session_sport_pics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_cca_enrollments e
      WHERE e.cca_activity_id = cca_session_sport_pics.activity_id
        AND public.is_parent_of_student(e.student_id)
    )
  );

CREATE POLICY "Admins manage all lesson week subtopics"
  ON public.lesson_week_subtopics FOR ALL
  TO authenticated
  USING (public.is_admin_like())
  WITH CHECK (public.is_admin_like());

CREATE POLICY "Parents can read their children's additional achievements"
  ON public.student_additional_achievements FOR SELECT
  TO authenticated
  USING (public.is_parent_of_student(student_id));

DROP POLICY IF EXISTS "Authenticated users can upload bug attachments" ON storage.objects;

CREATE POLICY "Admins can upload bug attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bug-report-attachments' AND public.is_admin_like());
