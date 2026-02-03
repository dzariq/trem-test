-- Function to validate if a student is eligible to enroll in a CCA activity
-- Uses Key Stage mapping: KS1 (Y1-Y2), KS2 (Y3-Y6), KS3 (Y7-Y9), KS4 (Y10-Y11)
CREATE OR REPLACE FUNCTION public.validate_cca_enrollment_eligibility(
  p_student_id UUID,
  p_activity_id UUID
)
RETURNS TABLE(
  is_eligible BOOLEAN,
  student_year_level TEXT,
  student_key_stage TEXT,
  activity_year_levels TEXT[],
  error_message TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_level TEXT;
  v_key_stage TEXT;
  v_activity_year_levels TEXT[];
  v_activity_name TEXT;
BEGIN
  -- Get student's year level
  SELECT s.year_level INTO v_year_level
  FROM public.students s
  WHERE s.id = p_student_id;
  
  IF v_year_level IS NULL THEN
    RETURN QUERY SELECT 
      false AS is_eligible,
      NULL::TEXT AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      'Student not found or has no year level assigned'::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Map year level to Key Stage
  v_key_stage := CASE 
    WHEN v_year_level IN ('Y1', 'Y2') THEN 'KS1'
    WHEN v_year_level IN ('Y3', 'Y4', 'Y5', 'Y6') THEN 'KS2'
    WHEN v_year_level IN ('Y7', 'Y8', 'Y9') THEN 'KS3'
    WHEN v_year_level IN ('Y10', 'Y11') THEN 'KS4'
    ELSE NULL
  END;
  
  IF v_key_stage IS NULL THEN
    RETURN QUERY SELECT 
      false AS is_eligible,
      v_year_level AS student_year_level,
      NULL::TEXT AS student_key_stage,
      NULL::TEXT[] AS activity_year_levels,
      ('Invalid year level: ' || v_year_level)::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Get activity's eligible year levels
  SELECT a.year_levels, a.name INTO v_activity_year_levels, v_activity_name
  FROM public.cca_activities a
  WHERE a.id = p_activity_id AND a.is_active = true;
  
  IF v_activity_year_levels IS NULL THEN
    -- If activity not found or has no year levels, check if activity exists
    IF NOT EXISTS (SELECT 1 FROM public.cca_activities WHERE id = p_activity_id AND is_active = true) THEN
      RETURN QUERY SELECT 
        false AS is_eligible,
        v_year_level AS student_year_level,
        v_key_stage AS student_key_stage,
        NULL::TEXT[] AS activity_year_levels,
        'CCA activity not found or is inactive'::TEXT AS error_message;
      RETURN;
    END IF;
    -- Activity exists but has no year restrictions - allow all
    RETURN QUERY SELECT 
      true AS is_eligible,
      v_year_level AS student_year_level,
      v_key_stage AS student_key_stage,
      v_activity_year_levels AS activity_year_levels,
      NULL::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Check if 'All' is in the year levels - allows everyone
  IF 'All' = ANY(v_activity_year_levels) THEN
    RETURN QUERY SELECT 
      true AS is_eligible,
      v_year_level AS student_year_level,
      v_key_stage AS student_key_stage,
      v_activity_year_levels AS activity_year_levels,
      NULL::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Check if student's Key Stage is in the allowed year levels
  IF v_key_stage = ANY(v_activity_year_levels) THEN
    RETURN QUERY SELECT 
      true AS is_eligible,
      v_year_level AS student_year_level,
      v_key_stage AS student_key_stage,
      v_activity_year_levels AS activity_year_levels,
      NULL::TEXT AS error_message;
    RETURN;
  END IF;
  
  -- Not eligible
  RETURN QUERY SELECT 
    false AS is_eligible,
    v_year_level AS student_year_level,
    v_key_stage AS student_key_stage,
    v_activity_year_levels AS activity_year_levels,
    ('This activity is only available for ' || array_to_string(v_activity_year_levels, ', ') || '. Your year level (' || v_year_level || ') is in ' || v_key_stage || '.')::TEXT AS error_message;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_cca_enrollment_eligibility(UUID, UUID) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.validate_cca_enrollment_eligibility IS 'Validates if a student is eligible to enroll in a CCA activity based on year level to Key Stage mapping. Returns eligibility status and detailed information.';