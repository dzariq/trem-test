-- Set all calendar_events campus_code to NULL so they're visible to all campuses
-- These are school-wide events (holidays, celebrations, exams, etc.) shared across BO and GL
UPDATE calendar_events SET campus_code = NULL WHERE campus_code IS NOT NULL;