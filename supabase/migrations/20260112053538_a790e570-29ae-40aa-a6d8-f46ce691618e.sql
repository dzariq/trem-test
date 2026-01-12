-- Create a security definer function to safely check if a phone exists
-- This allows anon users to check phone existence without exposing other data
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Normalize the phone number and check existence
  SELECT jsonb_build_object(
    'exists', true,
    'role', role
  ) INTO result
  FROM public.user_profiles
  WHERE phone = phone_number
    AND is_active = true
  LIMIT 1;
  
  IF result IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'role', null);
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO authenticated;