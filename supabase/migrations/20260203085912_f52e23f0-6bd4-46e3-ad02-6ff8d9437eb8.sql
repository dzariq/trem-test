-- Update the validate_cca_enrollment_eligibility function to use cca_club_year_eligibility table
-- instead of the year_levels array on cca_activities

CREATE OR REPLACE FUNCTION public.validate_cca_enrollment_eligibility(
  p_student_id UUID,
  p_activity_id UUID
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  student_year_level TEXT,
  student_key_stage TEXT,
  activity_year_levels TEXT[],
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_level TEXT;
  v_activity_name TEXT;
  v_eligible_years TEXT[];
  v_is_active BOOLEAN;
BEGIN
  -- Get student's year level (normalize to uppercase)
  SELECT UPPER(TRIM(s.year_level)) INTO v_year_level
  FROM public.students s
  WHERE s.id = p_student_id;
  
  IF v_year_level IS NULL OR v_year_level = '' THEN
    RETURN QUERY SELECT 
      false AS is_eligible,
      NULL::TEXT AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      'Student not found or has no year level assigned'::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Get activity details
  SELECT a.name, a.is_active INTO v_activity_name, v_is_active
  FROM public.cca_activities a
  WHERE a.id = p_activity_id;
  
  IF v_activity_name IS NULL THEN
    RETURN QUERY SELECT 
      false AS is_eligible,
      v_year_level AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      'CCA activity not found'::TEXT AS error_message;
    RETURN;
  END IF;
  
  IF NOT v_is_active THEN
    RETURN QUERY SELECT 
      false AS is_eligible,
      v_year_level AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      'CCA activity is not currently active'::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Get eligible years from cca_club_year_eligibility table
  SELECT ARRAY_AGG(UPPER(TRIM(e.year_code))) INTO v_eligible_years
  FROM public.cca_club_year_eligibility e
  WHERE e.club_id = p_activity_id;
  
  -- If no eligibility records exist, activity is open to all
  IF v_eligible_years IS NULL OR array_length(v_eligible_years, 1) IS NULL THEN
    RETURN QUERY SELECT 
      true AS is_eligible,
      v_year_level AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      NULL::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Check if student's year level matches any eligible year
  IF v_year_level = ANY(v_eligible_years) THEN
    RETURN QUERY SELECT 
      true AS is_eligible,
      v_year_level AS student_year_level,
      NULL::TEXT AS student_key_stage,
      v_eligible_years AS activity_year_levels,
      NULL::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Not eligible
  RETURN QUERY SELECT 
    false AS is_eligible,
    v_year_level AS student_year_level,
    NULL::TEXT AS student_key_stage,
    v_eligible_years AS activity_year_levels,
    ('This activity is only available for ' || array_to_string(v_eligible_years, ', ') || '. Your year level is ' || v_year_level || '.')::TEXT AS error_message;
END;
$$;

-- Create RPC function to get eligible CCA activities for a student
-- This is used for filtering the activity list in the parent/student app
CREATE OR REPLACE FUNCTION public.get_eligible_cca_activities(
  p_student_id UUID
)
RETURNS TABLE (
  activity_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_level TEXT;
BEGIN
  -- Get student's year level (normalize to uppercase)
  SELECT UPPER(TRIM(s.year_level)) INTO v_year_level
  FROM public.students s
  WHERE s.id = p_student_id;
  
  -- If no year level, return empty
  IF v_year_level IS NULL OR v_year_level = '' THEN
    RETURN;
  END IF;
  
  -- Return activities where:
  -- 1. Activity is active
  -- 2. Either no eligibility records exist (open to all) OR student's year matches
  RETURN QUERY
  SELECT DISTINCT a.id AS activity_id
  FROM public.cca_activities a
  WHERE a.is_active = true
    AND (
      -- No eligibility records = open to all
      NOT EXISTS (
        SELECT 1 FROM public.cca_club_year_eligibility e WHERE e.club_id = a.id
      )
      OR
      -- Student's year is in the eligibility list
      EXISTS (
        SELECT 1 FROM public.cca_club_year_eligibility e 
        WHERE e.club_id = a.id AND UPPER(TRIM(e.year_code)) = v_year_level
      )
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_cca_enrollment_eligibility(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_cca_activities(UUID) TO authenticated;