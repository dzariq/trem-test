CREATE POLICY "Parents can view their own tickets"
ON public.parent_tickets
FOR SELECT
TO authenticated
USING (public.is_ticket_owner(parent_email));