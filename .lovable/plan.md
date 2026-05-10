# Calendar ↔ Supabase Campus Audit

## What's already correct

- `calendar_events` is fetched with the new `event_categories` join (UUID → name) — re-linking from the previous fix is intact.
- Teacher Calendar page (`TeacherCalendarPage`) passes `activeCampus` from `useCampus()` into `listCalendarEvents` and re-fetches when toggled.
- Parent Calendar page passes `selectedStudent.campus_code` (parents don't toggle — they follow the selected child's campus, which is correct).
- Teacher Home (`TeacherHomePage`) passes `activeCampus` into `listUpcomingEvents`.
- Parent Home (`HomePage`) passes `parentCampusCode` into `listUpcomingEvents`.
- Server filter uses `.or(campus_code.eq.X, campus_code.is.null)` — correctly includes school-wide events that have no campus.
- DB sanity: `calendar_events` currently has 184 rows tagged `GL`, 0 rows tagged `BO`. So toggling BO legitimately shows an empty calendar (no bug — just no data on that side).

## Gaps to fix

### 1. `useUpcomingDeadlines` ignores the campus toggle
File: `src/hooks/useUpcomingDeadlines.ts`

- The `examinations` query has no campus filter.
- The fallback `listUpcomingEvents({ role: "teacher", limit: 20 })` call hardcodes role and omits `campusCode`.
- Result: the "Upcoming Deadlines" widget on Teacher Home shows GL exams/events even after toggling to BO.

Fix: accept an optional `campusCode` arg (default from `useCampus().activeCampus` at the call site), apply `.or(campus_code.eq.X, campus_code.is.null)` to the examinations query (only if that column exists — otherwise leave examinations unscoped and just scope the events fallback), and forward `campusCode` to `listUpcomingEvents`. Re-run when `activeCampus` changes.

### 2. CCA sessions on the calendar are not campus-scoped
File: `src/hooks/useCcaSessionsCalendar.ts`

- `cca_sessions` is fetched globally; sessions from the other campus appear on the toggled view.

Fix: join `cca_activities.campus_code` (or join via `school_locations`) and filter by `activeCampus` (with `is.null` fallback). Add `activeCampus` to the hook's dep list.

### 3. Single-campus accounts still see the toggle pill
File: `src/components/campus/CampusToggle.tsx`

- The pill renders when `campuses.length > 0`, so standalone-campus teachers see a one-button "toggle" that does nothing useful.
- `CampusSwitcher` (the bigger card) already correctly hides when `!isMultiCampus`.

Fix: change the early-return in `CampusToggle` from `campuses.length === 0` to `campuses.length < 2` so single-campus accounts simply don't see a toggle. Their `activeCampus` is still set (to their one campus), so all scoped queries continue to work.

### 4. Notification calendar resolution (sanity check)
File: `src/hooks/useNotifications.ts`

- Already uses the `event_categories` join after the previous fix. Verify the calendar-events fetch inside the hook also accepts/passes `campusCode` so cross-campus event notifications don't leak. Add the same `.or(eq, is.null)` filter when a campus is active.

## Out of scope / no DB changes

- No Supabase migrations. The other Lovable project sharing this Supabase is unaffected.
- No changes to RLS, triggers, or `event_categories` mapping.
- BO having 0 events is a content/seeding question for the admin portal, not an app bug — the empty state is correct behaviour.

## Smoke test after the fix

1. As a multi-campus teacher: toggle GL → events, exams, CCA sessions, deadlines all show GL. Toggle BO → all four surfaces become empty (or show only school-wide rows). No GL leakage.
2. As a single-campus teacher: no toggle pill in the header; calendar still loads their campus.
3. As a parent: switch child between campuses — calendar updates to that child's campus.

## Technical summary

- 4 frontend files touched: `useUpcomingDeadlines.ts`, `useCcaSessionsCalendar.ts`, `CampusToggle.tsx`, `useNotifications.ts`.
- New optional `campusCode` parameter pattern, mirroring the existing `listCalendarEvents` / `listUpcomingEvents` signature.
- All new filters use the same `.or(campus_code.eq.X, campus_code.is.null)` pattern already proven elsewhere in `src/data/calendar.ts`.
