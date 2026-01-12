
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Staff can view parent tickets" ON public.parent_tickets;

-- Policy 1: Admins can view all tickets
-- Rationale: Admins need full visibility for oversight and management
CREATE POLICY "Admins can view all parent tickets"
ON public.parent_tickets
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy 2: Teachers can only view tickets assigned to them
-- Rationale: Least-privilege - teachers only see PII for their assigned cases
CREATE POLICY "Teachers can view assigned tickets"
ON public.parent_tickets
FOR SELECT
TO authenticated
USING (
  is_teacher() AND assigned_to = auth.uid()
);

-- Policy 3: Parents can view their own tickets (by email match)
-- Rationale: Parents should see tickets they submitted
-- Note: This requires the parent to be logged in with matching email
CREATE POLICY "Parents can view their own tickets"
ON public.parent_tickets
FOR SELECT
TO authenticated
USING (
  parent_email = (SELECT email FROM public.user_profiles WHERE user_id = auth.uid())
);
