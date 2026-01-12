-- Fix Security Findings: Tighten RLS policies for sensitive data

-- 1. Drop overlapping/duplicate policies on user_profiles
DROP POLICY IF EXISTS "read own profile" ON public.user_profiles;

-- The existing "Users can view own profile or admins can view all" is sufficient
-- But ensure it only allows users to see their own profile unless admin
-- Already correct: ((auth.uid() = user_id) OR is_admin())

-- 2. Fix parent_tickets: Change email-based matching to use a security definer function
-- Create a function to check if a parent owns a ticket by user_id match
CREATE OR REPLACE FUNCTION public.is_ticket_owner(ticket_parent_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND email = ticket_parent_email
  )
$$;

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "Parents can view their own tickets" ON public.parent_tickets;

-- Create a more secure policy that uses the security definer function
CREATE POLICY "Parents can view their own tickets"
ON public.parent_tickets
FOR SELECT
USING (public.is_ticket_owner(parent_email));

-- 3. Add INSERT policy for parents to create their own tickets
-- First check if it exists
DROP POLICY IF EXISTS "Parents can insert their own tickets" ON public.parent_tickets;

CREATE POLICY "Parents can insert their own tickets"
ON public.parent_tickets
FOR INSERT
WITH CHECK (
  parent_email = (SELECT email FROM public.user_profiles WHERE user_id = auth.uid())
);

-- 4. Create a function to check if user is a parent with specific role
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND role = 'parent'
  )
$$;

-- 5. Ensure students table policies don't expose data to all parents
-- The existing policies look correct:
-- - "Parents can view linked students" requires student_guardians link
-- - "Staff can view students" requires is_admin() OR is_teacher()
-- - We have duplicate policies, let's clean them up

DROP POLICY IF EXISTS "parents_can_read_linked_students" ON public.students;
-- Keep "Parents can view linked students" which has same logic

-- 6. Clean up duplicate student_guardians policies
DROP POLICY IF EXISTS "parents_can_read_their_student_links" ON public.student_guardians;
-- Keep "Parents can view own student guardians" which is more restrictive (also checks role)