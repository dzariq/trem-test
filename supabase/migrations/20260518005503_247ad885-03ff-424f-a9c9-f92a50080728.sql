-- Add is_principal() alias matching the CCA permission spec wording.
-- Returns true for the same set of roles as is_admin_like()
-- (super_admin, admin, principal). Centralizing this means downstream
-- RLS policies that use is_principal() stay valid regardless of role list changes.
CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_like();
$$;

-- Rename misleading policy: WITH CHECK has always required is_admin_like(),
-- so "or PICs" was inaccurate. Pure cosmetic rename.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cca_activities'
      AND policyname='Admins or PICs can insert activities'
  ) THEN
    ALTER POLICY "Admins or PICs can insert activities"
      ON public.cca_activities
      RENAME TO "Principals can insert activities";
  END IF;
END$$;