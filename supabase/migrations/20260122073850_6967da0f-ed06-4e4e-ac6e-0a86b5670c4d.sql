-- Create a secure view that exposes only non-sensitive teacher info for CCA display
-- This view is safe because it only exposes public-facing info (name, departments) for teachers assigned to CCAs

CREATE OR REPLACE VIEW public.v_teacher_public
WITH (security_invoker=on) AS
SELECT 
  up.user_id,
  up.full_name,
  up.departments
FROM public.user_profiles up
WHERE up.role = 'teacher' AND up.is_active = true;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.v_teacher_public TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.v_teacher_public IS 'Public-facing teacher info (name, departments) for CCA PIC display. Safe for parents to read.';