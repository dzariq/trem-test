# Fix "Deadlines unavailable" red notification

## Root cause

`useUpcomingDeadlines` queries `examinations` with `.or("campus_code.eq.X,campus_code.is.null")`, but the `examinations` table has no `campus_code` column. Supabase returns error `42703` ("column examinations.campus_code does not exist"), the catch block fires, and a destructive toast pops up — even though the real situation is simply "no upcoming deadlines."

Confirmed:
- Console log: `column examinations.campus_code does not exist`
- DB schema for `examinations`: `id, academic_year, exam_name, start_date, end_date, dates_text, sort_order, created_at, updated_at, code` (no `campus_code`)
- DB check: 9 examinations total, 0 in the next 30 days → empty list is the correct outcome

## Changes (single file: `src/hooks/useUpcomingDeadlines.ts`)

1. Remove the `campus_code` filter on the `examinations` query (the table is global). Keep the `campusCode` parameter for the `listUpcomingEvents` fallback only.
2. Remove the destructive `toast({...})` call in the catch block. An empty deadline list should render the existing "No upcoming deadlines" UI silently. Keep `console.error` logging via `logSupabaseError` so issues are still debuggable.
3. Leave the rest of the logic (fallback to calendar events, limit, loading state) untouched.

## Out of scope

No DB migration. No UI changes in `TeacherHomePage` — it already handles the empty state with the "No upcoming deadlines" message visible in the screenshot.
