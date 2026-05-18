SELECT cron.unschedule('weekly-calendar-digest');
DROP FUNCTION IF EXISTS public.create_weekly_calendar_digest(date);
DELETE FROM public.notifications WHERE type = 'weekly_digest' AND title = 'This week at school';