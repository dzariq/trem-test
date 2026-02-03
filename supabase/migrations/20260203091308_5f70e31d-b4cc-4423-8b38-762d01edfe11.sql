-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS public.validate_cca_enrollment_eligibility(UUID, UUID);

-- Recreate with correct return type (matching original)
CREATE OR REPLACE FUNCTION public.validate_cca_enrollment_eligibility(p_student_id UUID, p_activity_id UUID)
RETURNS TABLE(
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
  v_is_club BOOLEAN;
  v_is_active BOOLEAN;
  v_activity_years TEXT[];
BEGIN
  -- Get student's year_level
  SELECT year_level INTO v_year_level
  FROM students
  WHERE id = p_student_id;
  
  IF v_year_level IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT[], 'Student not found or year level not set'::TEXT;
    RETURN;
  END IF;
  
  -- Get activity info
  SELECT is_club, is_active INTO v_is_club, v_is_active
  FROM cca_activities
  WHERE id = p_activity_id;
  
  IF v_is_active IS NULL THEN
    RETURN QUERY SELECT false, v_year_level, NULL::TEXT, NULL::TEXT[], 'Activity not found'::TEXT;
    RETURN;
  END IF;
  
  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, v_year_level, NULL::TEXT, NULL::TEXT[], 'Activity is not active'::TEXT;
    RETURN;
  END IF;
  
  IF NOT v_is_club THEN
    RETURN QUERY SELECT false, v_year_level, NULL::TEXT, NULL::TEXT[], 'This activity is not available for self-enrollment'::TEXT;
    RETURN;
  END IF;
  
  -- Get eligible year levels for this activity
  SELECT ARRAY_AGG(year_code ORDER BY year_code) INTO v_activity_years
  FROM cca_club_year_eligibility
  WHERE club_id = p_activity_id;
  
  -- If no eligibility records exist, the club is not available
  IF v_activity_years IS NULL OR array_length(v_activity_years, 1) IS NULL THEN
    RETURN QUERY SELECT false, v_year_level, NULL::TEXT, v_activity_years, 'This club has no eligible year levels configured'::TEXT;
    RETURN;
  END IF;
  
  -- Check if student's year level is in the eligible list
  IF v_year_level = ANY(v_activity_years) THEN
    RETURN QUERY SELECT true, v_year_level, NULL::TEXT, v_activity_years, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, v_year_level, NULL::TEXT, v_activity_years, 
      ('Not eligible: ' || v_year_level || ' is not in the allowed years')::TEXT;
  END IF;
END;
$$;

-- Fix get_eligible_cca_activities to only return clubs (is_club = true) that have eligibility records
CREATE OR REPLACE FUNCTION public.get_eligible_cca_activities(p_student_id UUID)
RETURNS TABLE(activity_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_level TEXT;
BEGIN
  -- Get student's year_level
  SELECT year_level INTO v_year_level
  FROM students
  WHERE id = p_student_id;
  
  -- If no year level found, return empty
  IF v_year_level IS NULL THEN
    RETURN;
  END IF;
  
  -- Return only clubs (is_club = true) that have eligibility records for this year level
  RETURN QUERY
  SELECT DISTINCT ca.id
  FROM cca_activities ca
  INNER JOIN cca_club_year_eligibility e ON e.club_id = ca.id
  WHERE ca.is_active = true
    AND ca.is_club = true
    AND e.year_code = v_year_level;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_eligible_cca_activities(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_cca_enrollment_eligibility(UUID, UUID) TO authenticated;