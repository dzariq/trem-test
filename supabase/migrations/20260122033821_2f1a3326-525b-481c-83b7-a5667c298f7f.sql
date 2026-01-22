-- Create junction table for CCA activity teachers (Person In Charge)
CREATE TABLE IF NOT EXISTS public.cca_activity_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.cca_activities(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'pic', -- 'pic' = person in charge, 'assistant', etc.
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, teacher_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_cca_activity_teachers_activity ON public.cca_activity_teachers(activity_id);
CREATE INDEX idx_cca_activity_teachers_teacher ON public.cca_activity_teachers(teacher_user_id);

-- Enable RLS
ALTER TABLE public.cca_activity_teachers ENABLE ROW LEVEL SECURITY;

-- RLS policies for cca_activity_teachers
-- Teachers can read CCA assignments for activities they're assigned to
CREATE POLICY "Teachers can view their CCA assignments"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND teacher_user_id = auth.uid()
);

-- Teachers can view all PIC info for activities they're part of
CREATE POLICY "Teachers can view all PICs for their activities"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.cca_activity_teachers cat
    WHERE cat.activity_id = cca_activity_teachers.activity_id
    AND cat.teacher_user_id = auth.uid()
  )
);

-- Parents can view PIC info for active CCAs
CREATE POLICY "Parents can view CCA PICs"
ON public.cca_activity_teachers
FOR SELECT
TO authenticated
USING (
  public.is_parent() AND EXISTS (
    SELECT 1 FROM public.cca_activities ca
    WHERE ca.id = cca_activity_teachers.activity_id
    AND ca.is_active = true
  )
);

-- Admin can manage all
CREATE POLICY "Admins can manage CCA teacher assignments"
ON public.cca_activity_teachers
FOR ALL
TO authenticated
USING (public.is_admin_like())
WITH CHECK (public.is_admin_like());

-- RLS policy for cca_activities - teachers can view their assigned CCAs
CREATE POLICY "Teachers can view their assigned CCAs"
ON public.cca_activities
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.cca_activity_teachers cat
    WHERE cat.activity_id = cca_activities.id
    AND cat.teacher_user_id = auth.uid()
  )
);

-- RLS policy for cca_activities - parents can view active CCAs
CREATE POLICY "Parents can view active CCAs"
ON public.cca_activities
FOR SELECT
TO authenticated
USING (
  public.is_parent() AND is_active = true
);

-- RLS policy for cca_sessions - teachers can view sessions for their CCAs
CREATE POLICY "Teachers can view sessions for their CCAs"
ON public.cca_sessions
FOR SELECT
TO authenticated
USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.cca_activity_teachers cat
    WHERE cat.activity_id = cca_sessions.activity_id
    AND cat.teacher_user_id = auth.uid()
  )
);

-- RLS policy for cca_sessions - parents can view sessions for active CCAs
CREATE POLICY "Parents can view sessions for active CCAs"
ON public.cca_sessions
FOR SELECT
TO authenticated
USING (
  public.is_parent() AND EXISTS (
    SELECT 1 FROM public.cca_activities ca
    WHERE ca.id = cca_sessions.activity_id
    AND ca.is_active = true
  )
);

-- Update trigger for timestamps
CREATE TRIGGER update_cca_activity_teachers_updated_at
BEFORE UPDATE ON public.cca_activity_teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();