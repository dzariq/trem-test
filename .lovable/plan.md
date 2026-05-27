## Parent Attendance — Multi-Child Aggregation

Mirror the calendar-page pattern on `AttendancePage.tsx` so parents see an aggregated view of all their children by default, with a dropdown to drill into one child.

### Changes

**1. Header / scope selector**
- Rename card title `Yearly Overview` → `Attendance Overview`.
- Change default chart zoom from `12` (Yearly) to `3` (3 Months).
- For parents with >1 child: hide the shared `showChildSelector` bar and render a local `Select` directly under the header with options `All Children` + each child. Default = `all`. Parents with only 1 child keep the existing header selector.

**2. Data hooks (`src/hooks/useParentAttendance.ts`)**
Extend both `useParentAttendance` and `useRollingAttendance` to accept `string | string[] | null`:
- When an array is passed, query with `.in("student_id", ids)` instead of `.eq`.
- Aggregation logic for monthly/rolling chart buckets is already a sum per day — keep summing across all returned rows (no change beyond the query filter). The chart automatically reflects combined totals.
- Keep `student_id` and `student_name` in the returned records so the UI can branch on single vs. multi.

**3. Monthly Summary tiles**
- Continue using `getMonthlySummary()` totals; in multi-child mode they become the combined count for that month. No structural change.

**4. Daily Breakdown — smart rendering**
Branch on the active scope:

- **Single child (current behaviour):** one tile per day with status icon + label, exactly as today.
- **All children:** group records by date, then by child. Each day tile becomes a card containing:
  - Date header (e.g. `Mon 12`, with optional "Today" pill).
  - A compact row per child showing the child's first name + a small coloured status pill (Present / Absent / Late / Excused), tapping the row opens the existing day detail sheet pre-filled for that child.
  - If a child has no record for that date (school day with no entry yet), show a muted `—` instead of a pill.

Filter chips (All / Present / Absent / Late / Excused) keep working — counts become the union across all children, and the chip filter hides child rows that don't match the selected status (whole-day card hidden if no child rows remain).

**5. Day detail bottom sheet**
- When opened from the multi-child view, show the child's name at the top of the sheet and use that child's record (status, remarks, reason).
- Single-child view behaves exactly as today.

**6. Empty-state copy**
- Multi-child mode: replace "Your child…" wording with "Your children…" / generic copy when no records exist for any of them.

### Out of scope
- No DB / RLS / schema changes — parents already have RLS read access for every linked student.
- No changes to teacher attendance pages or to the home `AttendanceSummary` widget (already aggregated separately).
- No new chart breakdown per-child (chart stays as a combined stacked bar — per-child slicing happens only in Daily Breakdown).

### Files touched
- `src/pages/AttendancePage.tsx` — title, default zoom, local scope selector, daily breakdown branching, sheet child label.
- `src/hooks/useParentAttendance.ts` — accept array input for both hooks, switch query to `.in()` when array supplied.
