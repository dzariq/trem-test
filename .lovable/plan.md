## Goal

Teachers should only see CCA activities (and their sessions in the Calendar) where they have actionable access:
- Main or Sub PIC on the activity (`cca_activity_teachers`)
- Bus PIC on an outdoor CCA (`cca_outdoor_buses.teacher_pic_main` / `_sub`)
- Principals (super_admin / admin / school_leader) continue to see everything

The existing year-level / class-name overlap fallback is removed for teachers.

## Changes

### 1. `src/hooks/useCcaActivityFilter.ts`
- Drop `teacherYearLevels` / `teacherClassNames` matching.
- Add a query to load activity IDs where the teacher is a bus PIC (one fetch per session via a small new hook `useTeacherBusPicActivityIds`).
- `canSee` becomes: principal → true; teacher → PIC on activity OR activity id is in the bus-PIC id set; else false.
- Applies to Teacher CCA list page automatically (already consumes this hook).

### 2. `src/hooks/useCcaSessionsCalendar.ts`
- In the `scopeToTeacher` branch, remove the year_levels / classes_involved overlap fetches.
- Keep only the two existing PIC sources:
  - `cca_activity_teachers` (Main/Sub PIC)
  - `cca_outdoor_buses` (Bus PIC)
- Result: calendar grid + day list only show sessions for activities the teacher PICs.

### 3. `src/hooks/useCcaActivityPermissions.ts`
- Remove `hasYearOverlap` from the canView calculation for teachers. `canView` for teachers = `isActivityPIC || isBusPic` (bus-PIC handled via existing `useIsBusPicForActivity` already used in detail page).
- Keep `canEdit` semantics unchanged (principal or activity PIC).
- Principals still see / edit all.

### 4. `src/pages/teacher/TeacherCalendarPage.tsx`
- No longer needs to pass `teacherYearLevels` / `teacherClassNames` to `useCcaSessionsCalendar`. Clean up the unused memos.

## Out of scope
- Parent calendar / parent CCA logic — unchanged.
- RLS policies — unchanged (server still permits broader read; this is a client-side visibility tightening matching what the user can act on).
- CCA detail page guards — already PIC/bus-PIC gated; nothing to change.

## Verification
- Login as a teacher who is NOT a PIC of any CCA → Calendar shows no CCA sessions; Teacher CCA list shows none.
- Login as a teacher who is Main PIC of one club → only that club's sessions appear on Calendar.
- Login as a teacher who is Sub PIC of an outdoor CCA bus only → that outdoor CCA appears on Calendar + CCA list.
- Login as admin / school_leader → sees all CCAs as before.
