-- Add campus_code column to cca_activities
ALTER TABLE public.cca_activities ADD COLUMN IF NOT EXISTS campus_code TEXT;

-- Add check constraint
ALTER TABLE public.cca_activities ADD CONSTRAINT cca_activities_campus_code_check CHECK (campus_code IN ('BO', 'GL'));

-- Default existing rows to GL
UPDATE public.cca_activities SET campus_code = 'GL' WHERE campus_code IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_cca_activities_campus ON public.cca_activities(campus_code);

-- Drop existing SELECT policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can view active CCA activities" ON public.cca_activities;
DROP POLICY IF EXISTS "Teachers can view CCA activities" ON public.cca_activities;
DROP POLICY IF EXISTS "Parents can view CCA activities" ON public.cca_activities;
DROP POLICY IF EXISTS "Anyone can view active CCA activities" ON public.cca_activities;
DROP POLICY IF EXISTS "Admins can manage CCA activities" ON public.cca_activities;

-- SELECT: super_admin sees all, others see their campus, parents can see all active
CREATE POLICY "Campus-scoped SELECT on cca_activities"
  ON public.cca_activities FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR campus_code = ANY(public.get_user_campuses())
    OR public.is_parent()
  );

-- INSERT: must match user's campus
CREATE POLICY "Campus-scoped INSERT on cca_activities"
  ON public.cca_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    campus_code = ANY(public.get_user_campuses())
    AND campus_code IN ('BO', 'GL')
  );

-- UPDATE: super_admin or own campus
CREATE POLICY "Campus-scoped UPDATE on cca_activities"
  ON public.cca_activities FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR campus_code = ANY(public.get_user_campuses())
  );