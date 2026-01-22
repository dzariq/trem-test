-- Drop the security invoker view and recreate as SECURITY DEFINER
DROP VIEW IF EXISTS public.v_teacher_public;

-- Create the view WITHOUT security_invoker (defaults to security definer behavior)
-- This allows the view owner's permissions to be used, bypassing RLS
CREATE VIEW public.v_teacher_public AS
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