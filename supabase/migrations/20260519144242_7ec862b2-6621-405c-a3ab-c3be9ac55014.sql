
CREATE TABLE IF NOT EXISTS public.cca_session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cca_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  notes text,
  marked_by uuid,
  marked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_cca_session_attendance_session ON public.cca_session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_cca_session_attendance_student ON public.cca_session_attendance(student_id);

DROP TRIGGER IF EXISTS trg_cca_session_attendance_updated_at ON public.cca_session_attendance;
CREATE TRIGGER trg_cca_session_attendance_updated_at
BEFORE UPDATE ON public.cca_session_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cca_session_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "csa_select" ON public.cca_session_attendance;
CREATE POLICY "csa_select" ON public.cca_session_attendance
FOR SELECT TO authenticated
USING (
  public.is_admin_like()
  OR public.is_teacher()
  OR EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = cca_session_attendance.student_id
      AND sg.guardian_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "csa_insert" ON public.cca_session_attendance;
CREATE POLICY "csa_insert" ON public.cca_session_attendance
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_like()
  OR EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    WHERE cs.id = cca_session_attendance.session_id
      AND public.is_cca_pic(cs.activity_id)
  )
);

DROP POLICY IF EXISTS "csa_update" ON public.cca_session_attendance;
CREATE POLICY "csa_update" ON public.cca_session_attendance
FOR UPDATE TO authenticated
USING (
  public.is_admin_like()
  OR EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    WHERE cs.id = cca_session_attendance.session_id
      AND public.is_cca_pic(cs.activity_id)
  )
)
WITH CHECK (
  public.is_admin_like()
  OR EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    WHERE cs.id = cca_session_attendance.session_id
      AND public.is_cca_pic(cs.activity_id)
  )
);

DROP POLICY IF EXISTS "csa_delete" ON public.cca_session_attendance;
CREATE POLICY "csa_delete" ON public.cca_session_attendance
FOR DELETE TO authenticated
USING (
  public.is_admin_like()
  OR EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    WHERE cs.id = cca_session_attendance.session_id
      AND public.is_cca_pic(cs.activity_id)
  )
);
