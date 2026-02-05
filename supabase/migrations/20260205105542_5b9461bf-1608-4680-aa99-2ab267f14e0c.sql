-- Create session-based enrollment table for teacher-managed student attendance
CREATE TABLE IF NOT EXISTS public.cca_session_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.cca_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrolled_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'enrolled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_cca_session_enrollments_session ON public.cca_session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_cca_session_enrollments_student ON public.cca_session_enrollments(student_id);

-- Enable RLS
ALTER TABLE public.cca_session_enrollments ENABLE ROW LEVEL SECURITY;

-- Teachers can view/manage session enrollments for activities they are PIC of
CREATE POLICY "Teachers can view session enrollments for their activities"
ON public.cca_session_enrollments
FOR SELECT
USING (
  public.is_teacher()
  AND EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    JOIN public.cca_activity_teachers cat ON cat.activity_id = cs.activity_id
    WHERE cs.id = cca_session_enrollments.session_id
    AND cat.teacher_user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert session enrollments for their activities"
ON public.cca_session_enrollments
FOR INSERT
WITH CHECK (
  public.is_teacher()
  AND EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    JOIN public.cca_activity_teachers cat ON cat.activity_id = cs.activity_id
    WHERE cs.id = cca_session_enrollments.session_id
    AND cat.teacher_user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete session enrollments for their activities"
ON public.cca_session_enrollments
FOR DELETE
USING (
  public.is_teacher()
  AND EXISTS (
    SELECT 1 FROM public.cca_sessions cs
    JOIN public.cca_activity_teachers cat ON cat.activity_id = cs.activity_id
    WHERE cs.id = cca_session_enrollments.session_id
    AND cat.teacher_user_id = auth.uid()
  )
);

-- Parents can only view their children's session enrollments
CREATE POLICY "Parents can view child session enrollments"
ON public.cca_session_enrollments
FOR SELECT
USING (
  public.is_parent()
  AND EXISTS (
    SELECT 1 FROM public.student_guardians sg
    WHERE sg.student_id = cca_session_enrollments.student_id
    AND sg.guardian_user_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins have full access to session enrollments"
ON public.cca_session_enrollments
FOR ALL
USING (public.is_admin_like())
WITH CHECK (public.is_admin_like());

-- Add trigger for updated_at
CREATE TRIGGER update_cca_session_enrollments_updated_at
BEFORE UPDATE ON public.cca_session_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Function to check if session is full
CREATE OR REPLACE FUNCTION public.is_cca_session_full(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.cca_session_enrollments
    WHERE session_id = p_session_id AND status = 'enrolled'
  ) >= (
    SELECT COALESCE(max_participants, 25) FROM public.cca_sessions
    WHERE id = p_session_id
  );
$$;

-- Function to get session enrollment count
CREATE OR REPLACE FUNCTION public.get_session_enrollment_count(p_session_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.cca_session_enrollments
  WHERE session_id = p_session_id AND status = 'enrolled';
$$;