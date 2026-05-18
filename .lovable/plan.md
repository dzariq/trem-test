# Teacher Calendar — Year-Group Scoped Events + Session Attendance

Mirror the parent-side scoping logic for teachers, then add a session attendance flow (lead/sub PIC can mark, other involved teachers can view only).

## 1. Scope teacher CCA visibility to assigned year groups

Today `TeacherCalendarPage` loads every CCA session and every CCA activity for the campus. Apply the same approach used on the parent side, but keyed on the teacher's assigned class_years instead of a single student.

- `useCcaSessionsCalendar` already accepts `scopeToStudent`. Add a parallel `scopeToTeacher` mode:
  - Inputs: teacher's `allowedClassYears` (from `useTeacherScope`) → derive an array of `year_level` codes and `class_name`s.
  - Include a session when its parent activity is either:
    - `kind in ('club','outdoor')` and the activity's `year_levels` intersects the teacher's year levels, OR
    - `kind = 'event'` and `classes_involved` intersects the teacher's class names.
  - If the teacher has no assignments → return `[]`.
- `useCcaActivities` (teacher CCA Schedule tab): apply the same filter post-fetch so the list under "CCA Schedule" only shows activities tied to the teacher's year groups. Keep the existing "I am PIC" badge logic untouched.

## 2. Session detail drawer — show key info for events

When the teacher taps a CCA event/outdoor/club session in the calendar grid or list, the existing `SessionDetailsSheet` opens. Extend it to surface:

- Kind bucket pill (Club / Outdoor / Event) — reuse helpers already added on parent side.
- Classes Involved chips (events only).
- Requirements, description, location, start/end time (already present where applicable — verify).
- A new **Attendance** section (see step 3).

No new drawer; we extend the existing one.

## 3. CCA session attendance (focus: outdoor + event sessions)

Add an attendance block inside `SessionDetailsSheet`.

### Permissions
- **Can mark / edit** (lead or sub PIC): teacher is in `cca_activity_teachers` for the session's activity with `is_primary = true` OR `role ILIKE 'pic'` OR `role ILIKE 'sub%'`. We already have this list loaded via `useCcaActivities`; derive `canManageAttendance` from it.
- **Read-only**: any other teacher who can see the session (i.e. passed the year-group scope above).
- Admin-like users always get write access.

### Data
- Table: `public.cca_session_attendance(session_id, student_id, status, notes, marked_by, marked_at, session_bus_id)`. Status values follow existing CCA pattern — start with `present | absent | late | excused` (confirm with the user if a different vocabulary is expected; see open question).
- Roster = students currently enrolled in this session via `cca_session_enrollments` where `status='enrolled'`. For event-type activities without per-session enrollments, fall back to students whose `class` is in `cca_activities.classes_involved`.

### UI
- Header row: counts (Present / Absent / Late / Excused / Unmarked) and last-saved timestamp.
- One row per student: name + class, status pill buttons (P/A/L/E), inline notes.
- For PIC: a Save button (upsert on `(session_id, student_id)`, set `marked_by = auth.uid()`, `marked_at = now()`).
- For non-PIC: same list rendered as read-only badges, no edit affordance.
- Loading + empty states ("No students enrolled yet").

### New hook
`useCcaSessionAttendance(sessionId, { canEdit })` modelled on `useTeacherAttendance`:
- Loads roster (enrollments or class fallback).
- Loads existing attendance rows.
- Exposes `setStudentStatus`, `setStudentNotes`, `save`, `summary`.

### RLS
`cca_session_attendance` currently lets any authenticated user read/insert/update. That is permissive enough to ship the UI today, but we should tighten it. Out of scope for this plan unless you say otherwise (see open question 2).

## 4. Out of scope
- Bus list / `cca_bus_assignments` integration (mentioned as context only; treat as a follow-up).
- Parent-side changes.
- Admin CCA management pages.
- Schema migrations beyond optional RLS hardening.

## Technical details

Files touched:
- `src/hooks/useCcaSessionsCalendar.ts` — add `scopeToTeacher` + `teacherYearLevels`/`teacherClassNames` inputs.
- `src/hooks/useCcaActivities.ts` — optional `teacherYearLevels` filter (or filter inline in the page).
- `src/pages/teacher/TeacherCalendarPage.tsx` — pass teacher scope; no UI restructuring.
- `src/hooks/useCcaSessionAttendance.ts` — new.
- `src/components/cca/SessionDetailsSheet.tsx` — add Classes Involved row + Attendance section; accept `canManageAttendance` prop.
- `src/components/cca/SessionAttendanceList.tsx` — new presentational component (rows + save bar).

Reused helpers: `getCcaBucket`, `getCcaTypePillColor`, `getCcaBucketIcon`, `formatClassDisplay`, `useTeacherScope`, `is_admin_like` (via existing role hooks).

## Open questions

1. **Attendance status vocabulary.** Daily attendance uses `present / absent / late / excused`. For CCA events do you want the same four, or a simpler `present / absent` (plus notes)?
2. **RLS hardening.** Right now any authenticated user can write `cca_session_attendance`. Want me to add a migration restricting writes to admin-like + activity PIC/sub-PIC in the same change, or leave it for a follow-up?
3. **Event roster source.** For events with no `cca_session_enrollments` rows, should the roster be every student in `classes_involved`, or only those explicitly invited (e.g. via a future RSVP table)? Plan above assumes the class-based fallback.
