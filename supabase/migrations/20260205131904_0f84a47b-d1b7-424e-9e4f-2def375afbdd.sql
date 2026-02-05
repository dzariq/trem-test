-- Step 1: Add source_key to notifications table with unique constraint
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS source_key text UNIQUE;

-- Step 2: Create notification_reads table for per-user read tracking
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

-- Enable RLS on notification_reads
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own reads
CREATE POLICY "Users can view their own notification reads"
ON public.notification_reads
FOR SELECT
USING (user_id = auth.uid());

-- RLS: Users can insert their own reads
CREATE POLICY "Users can insert their own notification reads"
ON public.notification_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS: Users can delete their own reads
CREATE POLICY "Users can delete their own notification reads"
ON public.notification_reads
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_reads_user 
ON public.notification_reads(user_id);

-- Step 3: Update notifications table - add body column if not exists
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS body text;

-- Step 4: Create function to upsert notifications from events
CREATE OR REPLACE FUNCTION public.notify_on_calendar_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_key text;
  v_target_audience text;
  v_link_to text;
BEGIN
  -- Only create notifications for active, public-ish events
  IF NEW.visibility NOT IN ('public', 'all', 'everyone') THEN
    RETURN NEW;
  END IF;
  
  v_source_key := 'event:' || NEW.id::text;
  
  -- Determine target audience based on event category/type
  IF NEW.event_category ILIKE '%staff%' OR NEW.event_category ILIKE '%teacher%' THEN
    v_target_audience := 'teacher';
    v_link_to := '/teacher/calendar';
  ELSIF NEW.event_category ILIKE '%parent%' OR NEW.event_category ILIKE '%family%' THEN
    v_target_audience := 'parent';
    v_link_to := '/parent/calendar';
  ELSE
    v_target_audience := 'all';
    v_link_to := '/parent/calendar';
  END IF;
  
  -- Upsert notification
  INSERT INTO public.notifications (
    user_id, title, message, type, link_to, is_read, target_audience, source_key, created_at, updated_at
  )
  SELECT 
    auth.uid(),
    NEW.title,
    COALESCE(NEW.description, 'New event scheduled: ' || NEW.title),
    'event',
    v_link_to,
    false,
    v_target_audience,
    v_source_key,
    NOW(),
    NOW()
  WHERE auth.uid() IS NOT NULL
  ON CONFLICT (source_key) 
  DO UPDATE SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for calendar events
DROP TRIGGER IF EXISTS trg_notify_calendar_event ON public.calendar_events;
CREATE TRIGGER trg_notify_calendar_event
AFTER INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_calendar_event();

-- Step 5: Create function to generate holiday/exam notifications
CREATE OR REPLACE FUNCTION public.notify_on_academic_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_key text;
BEGIN
  v_source_key := 'period:' || NEW.id::text;
  
  -- Create notification for all users about period opening
  IF NEW.status = 'open' THEN
    INSERT INTO public.notifications (
      user_id, title, message, type, link_to, is_read, target_audience, source_key, created_at, updated_at
    )
    SELECT
      up.user_id,
      'Grading Period Open: ' || NEW.name,
      NEW.name || ' grading period is now open for ' || COALESCE(NEW.academic_year::text, 'current year') || '.',
      'academic',
      CASE WHEN up.role = 'teacher' THEN '/teacher/academic' ELSE '/parent/academic' END,
      false,
      'all',
      v_source_key || ':' || up.user_id::text,
      NOW(),
      NOW()
    FROM public.user_profiles up
    WHERE up.is_active = true
      AND up.role IN ('teacher', 'parent')
    ON CONFLICT (source_key)
    DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for academic periods
DROP TRIGGER IF EXISTS trg_notify_academic_period ON public.academic_periods;
CREATE TRIGGER trg_notify_academic_period
AFTER INSERT OR UPDATE ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_academic_period();

-- Step 6: Add RLS policy for notifications if not exists
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR (
    target_audience = 'all'
    OR (target_audience = 'parent' AND public.current_user_role() IN ('parent', 'user'))
    OR (target_audience = 'teacher' AND public.current_user_role() = 'teacher')
  )
);

-- Step 7: Update notifications RLS for insert (allow system inserts)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin_like());