## Goal

Allow teachers who are main **or** sub PIC of a CCA club to take attendance for that club's session, with the roster automatically populated from the students enrolled in the club.

## Audit findings

- `SessionDetailsSheet` already renders `<SessionAttendanceList>` and gates editing with `canManageAttendance`, which is wired from `TeacherCalendarPage.isTeacherPICOfSession`. That check is `isPrimary || role === 'pic'`, and **all** rows in `cca_activity_teachers` have `role = 'pic'`, so both main (`is_primary=true`) and sub (`is_primary=false`) PICs already pass. ✅ No change needed there.
- `useCcaSessionAttendance` is **broken** today:
  - It queries `cca_session_enrollments` and `cca_session_attendance`, but neither table exists in the live database (migration was authored but never applied here — confirmed via `to_regclass`).
  - For clubs, the intended roster source is the club enrollment table `student_cca_enrollments` (status `active`, keyed by `cca_activity_id`), not session-level enrollments.
- PIC information for clubs lives in `cca_activity_teachers` (`is_primary` true = main, false = sub), already loaded by `useCcaActivities`.

## Scope

1. **DB migration — create `public.cca_session_attendance`**
   - Columns: `id uuid pk`, `session_id uuid not null → cca_sessions(id) on delete cascade`, `student_id uuid not null → students(id) on delete cascade`, `status text check in ('present','absent','late','excused')`, `notes text`, `marked_by uuid`, `marked_at timestamptz`, `created_at`, `updated_at`. Unique `(session_id, student_id)`.
   - Index on `session_id` and on `student_id`.
   - `update_updated_at` trigger (existing `public.update_updated_at_column` helper with `set search_path = public`).
   - RLS enabled. Policies:
     - **SELECT**: `is_admin_like()` OR `is_teacher()` OR parent of the student (via `student_guardians` join, matching the same pattern used on `cca_bus_assignments`).
     - **INSERT / UPDATE / DELETE**: `is_admin_like()` OR `is_cca_pic(activity_id)` via join through `cca_sessions → cca_activities`. We use the existing `is_cca_pic(activity uuid)` helper that already counts every row in `cca_activity_teachers` (so both main and sub PIC are covered).

2. **`src/hooks/useCcaSessionAttendance.ts`** — replace the roster query.
   - **Clubs / outdoors** (`activityKind !== 'event'`): roster = students from `student_cca_enrollments` where `cca_activity_id = activityId` and `status = 'active'`.
   - **Events** (`activityKind === 'event'`): keep the existing class-based fallback against `classes_involved`.
   - Drop the `cca_session_enrollments` lookup entirely (table doesn't exist and event mode already has its own path).
   - Existing-attendance read and save: keep using `cca_session_attendance` — now real.
   - Keep the same exported API (`students`, `stateMap`, `summary`, `setStudentStatus`, `setStudentNotes`, `save`, etc.) so `SessionAttendanceList` doesn't need changes.

3. **No UI changes** to `SessionAttendanceList` or `SessionDetailsSheet`. The existing Present/Absent/Late/Excused row UI is reused. The "View only" badge keeps showing for non-PICs.

4. **No changes** to `useCcaActivityPermissions`, `TeacherCalendarPage` PIC detection, or the bus attendance work.

## Verification

- Sign in as a teacher who is the **sub** PIC of a club → open a session → roster shows every student with `student_cca_enrollments.status='active'` for that club; status buttons enabled; Save persists rows to `cca_session_attendance`.
- Same for main PIC.
- Sign in as a teacher who is not PIC of the activity (no year overlap either) → roster still loads (RLS SELECT allows any teacher) but buttons are read-only.
- Parent viewing the session → sees only their own student's row state via the parent SELECT policy.
- Events still resolve roster from `classes_involved` (unchanged path).
- Re-open after save → previously marked statuses re-hydrate from `cca_session_attendance`.