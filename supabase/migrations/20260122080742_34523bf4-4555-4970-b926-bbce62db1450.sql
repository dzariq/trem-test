
-- =============================================================================
-- FIX 1: Security Definer View - Replace with security_invoker view + helper function
-- =============================================================================

-- Drop the security definer view
DROP VIEW IF EXISTS public.v_teacher_public;

-- Create a security definer function to fetch teacher info (safe alternative)
CREATE OR REPLACE FUNCTION public.get_teacher_public_info(p_teacher_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, departments text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.user_id,
    up.full_name,
    up.departments
  FROM public.user_profiles up
  WHERE up.user_id = p_teacher_user_id
    AND up.role = 'teacher'
    AND up.is_active = true;
$$;

-- Create a simpler view with security_invoker that uses the function
-- This view is for direct queries where the function approach isn't suitable
CREATE VIEW public.v_teacher_public
WITH (security_invoker=on) AS
SELECT 
  up.user_id,
  up.full_name,
  up.departments
FROM public.user_profiles up
WHERE up.role = 'teacher'
  AND up.is_active = true;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.v_teacher_public TO authenticated;

-- =============================================================================
-- FIX 2: user_profiles - Remove overly permissive teacher SELECT policy
-- =============================================================================

-- Drop the overly permissive policy that lets teachers see ALL profiles
DROP POLICY IF EXISTS "teachers_can_view_profiles" ON public.user_profiles;

-- Drop the redundant parent policy (already covered by own profile policy)
DROP POLICY IF EXISTS "parents_can_view_own_profile" ON public.user_profiles;

-- The remaining policies are:
-- - "Users can view own profile or admins can view all" (good)
-- - "user_profiles_select_own" (redundant but harmless, let's drop for clarity)
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;

-- Create a clean policy for users viewing their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all (keep existing policy "Users can view own profile or admins can view all")
-- This policy already handles admin access, but let's make it cleaner
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.user_profiles;

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (is_admin_like());

-- =============================================================================
-- FIX 3: enquiries - Add validation to prevent abuse (keep INSERT but add constraints)
-- =============================================================================

-- The current policy allows public INSERT with "true" - this is needed for public forms
-- But we should add a rate limit or validation. Since we can't do rate limiting in RLS,
-- we'll add a check that at least requires valid email format and non-empty fields

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow public enquiry submissions" ON public.enquiries;

-- Create a more restrictive INSERT policy
-- Still allows public submissions but requires the submitter to provide valid data
CREATE POLICY "Allow enquiry submissions with validation"
ON public.enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Require parent_name to be non-empty and reasonable length
  parent_name IS NOT NULL 
  AND length(trim(parent_name)) >= 2
  AND length(parent_name) <= 200
  -- Require valid email format
  AND parent_email IS NOT NULL
  AND parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- =============================================================================
-- FIX 4: students - IC numbers are sensitive, ensure parents only see their linked children
-- The existing policy "Parents can view linked students" is correct - it uses student_guardians
-- The IC fields (student_ic, parent1_ic, parent2_ic) are sensitive but parents need them
-- for their own children. The policy is already restrictive enough.
-- =============================================================================

-- No changes needed for students - the existing policies are correct:
-- - Parents can only see students linked via student_guardians (their own children)
-- - Teachers and admins can view all students (as expected for staff)
-- The IC numbers are visible to linked parents which is the intended behavior

-- =============================================================================
-- FIX: Mutable search_path warnings - set search_path on affected functions
-- =============================================================================

-- Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_timestamp function  
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
