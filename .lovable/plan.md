## Goal
On `/parent/calendar` → CCA tab ("Enrolled CCA Activities"), pull upcoming sessions for all 3 kinds — **clubs, outdoor, events** — for the selected student, sorted by soonest first.

## Scoping rules (per kind)
- **Club (`kind='club'`)** and **Outdoor (`kind='outdoor'`)**: show only when the student is **directly tagged/enrolled** in the activity → `student_cca_enrollments` where `student_id = selectedStudentId` and `status = 'active'`.
- **Event (`kind='event'`)**: show when the student's **class** appears in the activity's `classes_involved[]` (no per-student tagging required).

## Data approach
All 3 kinds share `cca_sessions` (linked via `activity_id` → `cca_activities`), so one session table query covers everything once we know the activity IDs.

### Resolve activity IDs for the selected student
1. Fetch student row: `class`, `year_level` from `students`.
2. **Enrolled activity IDs (clubs + outdoor)**:
   - `student_cca_enrollments` → `cca_activity_id` where `student_id = sel` and `status = 'active'`.
3. **Event activity IDs**:
   - `cca_activities` where `kind = 'event'`, `is_active = true`, `archived` not true, and `classes_involved` array contains the student's `class`.
4. Union the two lists.

### Fetch sessions
- `cca_sessions` where `activity_id IN (union)`, `session_date >= today`, `is_cancelled = false`, ordered by `session_date asc, start_time asc`, limited to N.
- Join `cca_activities(name, category, kind)` + `school_locations(name)` as today.
- Map `kind` onto the existing 3-bucket pill/icon system in `CcaTypeTabs` (clubs / outdoor / events).

## Files to change
- `src/hooks/useUpcomingCcaSessions.ts` — replace the parent branch's "year-level eligible" logic with the enrollment + event-class scoping above. Also include `kind` in the returned `UpcomingCcaSession` (so the card can pick the correct bucket icon/color reliably instead of inferring from `category`).
- `src/components/calendar/UpcomingEventsSection.tsx` (CCA tab card) — use the new `kind` field when computing `getCcaBucket`/`pillClass`/icon, falling back to category if missing. No layout changes.

## Out of scope
- Teacher branch (unchanged).
- Calendar grid/timeline tabs (already use the existing taxonomy/colors).
- Awards/`cca_activity_roles` are not used for scoping per the user's decision.
