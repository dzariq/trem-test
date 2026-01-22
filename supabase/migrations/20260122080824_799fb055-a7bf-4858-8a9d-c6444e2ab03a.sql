
-- Fix the remaining function with mutable search_path
CREATE OR REPLACE FUNCTION public.set_academic_period_status(p_period_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_like() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_status NOT IN ('open','closed','completed') THEN
    RAISE EXCEPTION 'invalid status %', p_status;
  END IF;

  -- If opening, close everything else first (so we never violate the unique index)
  IF p_status = 'open' THEN
    UPDATE public.academic_periods
    SET status = 'closed', is_open_for_grading = false, updated_at = now()
    WHERE id <> p_period_id AND status = 'open';
  END IF;

  UPDATE public.academic_periods
  SET status = p_status,
      is_open_for_grading = (p_status = 'open'),
      updated_at = now()
  WHERE id = p_period_id;
END;
$$;
