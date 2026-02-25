-- Create a trigger function that notifies parents when their child is marked absent or late
CREATE OR REPLACE FUNCTION public.notify_parent_on_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_guardian_user_id uuid;
  v_student_name text;
  v_source_key text;
  v_title text;
  v_message text;
  v_date_display text;
BEGIN
  -- Only notify for absent, late, or excused
  IF NEW.status NOT IN ('absent', 'late', 'excused') THEN
    RETURN NEW;
  END IF;

  -- Skip if this is an UPDATE and the status hasn't changed
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT name INTO v_student_name
  FROM public.students
  WHERE id = NEW.student_id;

  IF v_student_name IS NULL THEN
    v_student_name := COALESCE(NEW.student_name, 'Your child');
  END IF;

  -- Format date for display
  v_date_display := to_char(NEW.date::date, 'DD Mon YYYY');

  -- Build notification content based on status
  IF NEW.status = 'absent' THEN
    v_title := v_student_name || ' marked Absent';
    v_message := v_student_name || ' was marked absent on ' || v_date_display || '.';
  ELSIF NEW.status = 'late' THEN
    v_title := v_student_name || ' marked Late';
    v_message := v_student_name || ' was marked late on ' || v_date_display || '.';
  ELSIF NEW.status = 'excused' THEN
    v_title := v_student_name || ' marked Excused';
    v_message := v_student_name || ' was marked excused on ' || v_date_display || '.';
  END IF;

  -- Add remarks if present
  IF NEW.remarks IS NOT NULL AND NEW.remarks <> '' THEN
    v_message := v_message || ' Remarks: ' || NEW.remarks;
  END IF;

  v_source_key := 'attendance:' || NEW.student_id || ':' || NEW.date;

  -- Insert notification for each guardian of this student
  FOR v_guardian_user_id IN
    SELECT guardian_user_id
    FROM public.student_guardians
    WHERE student_id = NEW.student_id
  LOOP
    INSERT INTO public.notifications (
      user_id, title, message, type, link_to, is_read,
      target_audience, source_key, created_at, updated_at
    ) VALUES (
      v_guardian_user_id,
      v_title,
      v_message,
      'attendance',
      '/parent/attendance',
      false,
      'parent',
      v_source_key || ':' || v_guardian_user_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (source_key)
    DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      updated_at = NOW();
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on attendance table
DROP TRIGGER IF EXISTS trg_notify_parent_on_attendance ON public.attendance;
CREATE TRIGGER trg_notify_parent_on_attendance
AFTER INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_attendance();