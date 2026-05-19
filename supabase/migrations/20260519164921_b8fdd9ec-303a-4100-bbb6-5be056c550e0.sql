-- Fix parent_tickets privilege escalation: drop broader update policy, keep only status-gated one
DROP POLICY IF EXISTS "Parents can update their own tickets" ON public.parent_tickets;

-- Remove attendance from realtime publication to prevent broadcast bypassing RLS scoping
ALTER PUBLICATION supabase_realtime DROP TABLE public.attendance;