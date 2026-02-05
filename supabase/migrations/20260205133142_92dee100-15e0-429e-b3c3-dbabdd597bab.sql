-- Fix 1: Update existing notifications with proper targeting
-- Teacher-only notifications
UPDATE public.notifications 
SET target_audience = 'teacher' 
WHERE title IN ('Attendance Reminder', 'Grade Submission Due', 'Staff Meeting');

-- Parent-only notifications (academic updates they care about)
UPDATE public.notifications 
SET target_audience = 'parent' 
WHERE title IN ('New Curriculum Update');

-- School-wide notifications remain 'all'
UPDATE public.notifications 
SET target_audience = 'all' 
WHERE title IN ('School Holiday Notice');