
# Attendance Module Audit

I traced the parent flow (`AttendancePage`, `useStudentAttendanceSummary`, `useParentAttendance`), the teacher flow (`TeacherAttendancePage`, `useTeacherAttendance`, `useAttendanceStatistics`, `useAttendanceScopeFilter`, `data/teacherAttendance.ts`), the Supabase `attendance` table (with `campus_code`, RLS policies, and the `notify_parent_on_attendance` trigger), and the home widget (`AttendanceSummary`). Below are the real issues found, ordered by impact. None of these block basic usage today, but several are correctness/data‑integrity risks once data volume grows or the second campus goes live.

## High priority — correctness / data integrity

1. **Teacher save does not stamp `campus_code`**
   `useTeacherAttendance.save()` calls `saveAttendance(selectedClass, dateString, records)` and never passes the active campus. `data/teacherAttendance.ts` accepts an optional `campusCode` and only sets it when provided, so every new row is inserted with `campus_code = NULL`. Combined with the `campus_code_select` RLS rule (`campus_code IS NULL` is visible to everyone), this makes future cross‑campus filtering impossible and risks data leaking across BO/GL.
   Fix: read `activeCampus` from `CampusContext` in `useTeacherAttendance` and forward `campusCode` to `saveAttendance`, `fetchStudentsByClass`, and `fetchAttendanceForClassDate`. Also backfill existing NULL rows from the matching student's `campus_code`.

2. **Statistics queries ignore campus**
   `useAttendanceStatistics` filters only by class name. `TeacherAttendancePage`'s calendar marker fetch (the inline `supabase.from("attendance").select("date,status").eq("class", selectedClass)`) does the same. If two campuses ever share a class name (e.g. `Y1A`), stats and calendar dots will mix campuses.
   Fix: pass `activeCampus.code` into both queries and add `.eq("campus_code", code)` (or `.is(..., null)` fallback during the transition).

3. **Calendar marker query is unbounded**
   The inline fetch above pulls every attendance row for the class with no date range, then again every time `saving` flips true→false. As history grows this becomes a slow, repeated full‑class scan.
   Fix: bound to a visible window (e.g. ±3 months around `selectedDate`), refetch on month change, and only refetch on save success — not on `saving` start.

4. **Default selected year is hard‑coded**
   Both `AttendancePage` (parent) and `TeacherAttendancePage` (statistics) initialize `selectedYear` to `"2026"`, and the year `<Select>` lists are hard‑coded (`["2026","2025","2024"]` / `["2026","2025"]`). On 1 Jan 2027 both screens silently show the wrong year.
   Fix: default to `String(new Date().getFullYear())` and generate the option list from current year backwards (e.g. 3 years).

5. **Notification trigger fires for every status, including `present`**
   `notify_parent_on_attendance` writes a notification on every insert/update, producing "<Student> is Present on …" messages. The memory `parent-attendance-notifications` says only absences should notify.
   Fix: in the trigger, `RETURN NEW` early when `NEW.status = 'present'` (or only fire for `absent`/`late`/`excused`).

## Medium priority — UX / consistency

6. **Status normalization is inconsistent**
   `useParentAttendance` lowercases statuses everywhere, but `useAttendanceStatistics` uses the raw value. DB rows are currently lowercase, but any future capitalised insert would silently disappear from teacher stats.
   Fix: normalize to lowercase in both hooks (or add a DB CHECK / trigger to enforce lowercase on insert).

7. **Rolling‑window date math uses UTC, yearly uses local**
   In `useParentAttendance`, `getYearDateRange` builds local dates while `getRollingMonthsRange` calls `toISOString().split("T")[0]`. In timezones west of UTC (and in Malaysia at month boundaries) this can shift the start/end by one day.
   Fix: format both with `date-fns` `format(d, "yyyy-MM-dd")` so the boundary is always local.

8. **Parent "reason" parsing is fragile**
   `getDailyBreakdown` derives the reason by `remarks.split(" - ")[0]`. Teachers enter free‑form remarks, so the first token rarely is a reason.
   Fix: either drop the synthetic "reason" field and just show `remarks`, or add a dedicated column / structured remark.

9. **`fetchAvailableClasses` is bounded by Supabase's 1000‑row default**
   The non‑teacher path lists classes by selecting every active student row and de‑duping in JS. With 1000+ students it will silently drop classes.
   Fix: query `class_years` (already used elsewhere) or use `.select('class', { distinct: true })` via an RPC.

10. **Parent home widget's `chartData` is computed but unused**
    `useStudentAttendanceSummary` builds `monthlyBuckets`/`chartData` that nothing renders (the home card only uses `totals`).
    Fix: drop the unused memos to simplify the hook.

## Low priority — cleanup

11. **Dead state in TeacherAttendancePage**
    `statsSelectedClass`, `setStatsSelectedClass`, and `mockStudents` (from `classRosters`) are wired up but no longer read anywhere meaningful — statistics use `scopeFilter.resolvedClassNames`. Remove them and the `useEffect` that syncs them.

12. **Duplicate child selector on parent attendance**
    `AppHeader showChildSelector` plus the home widget's own student dropdown means the user sees two selectors. Consider hiding the header one on this page (it already drives the same `useStudentSelection` state).

13. **`useTeacherAttendance` toast import**
    `toast({ title, description, variant })` is called, which works, but the project also uses the `toast.success/error` shorthand elsewhere. Pick one for consistency.

14. **`saving` in marker effect dependency** (already covered in #3) — refetching twice per save is wasteful.

## Suggested implementation order

```text
1. Stamp campus_code on save + filter all attendance reads by campus      (high)
2. Fix notification trigger to skip "present"                             (high, 1 migration)
3. Default + dynamic year list on both pages                              (high, small)
4. Bound calendar marker query + remove `saving` dep                      (high)
5. Normalize status casing in useAttendanceStatistics                     (medium)
6. Local-time date formatting in useParentAttendance rolling window       (medium)
7. Drop dead code (statsSelectedClass, mockStudents, unused chartData)    (low)
8. Optional UX polish (single child selector, fetchAvailableClasses RPC)  (low)
```

## Technical notes

- The migration for the notification trigger only needs to add `IF lower(NEW.status) = 'present' THEN RETURN NEW; END IF;` near the top of `notify_parent_on_attendance`. Keep `SET search_path = public`.
- For backfilling `attendance.campus_code`, an `UPDATE attendance a SET campus_code = s.campus_code FROM students s WHERE a.student_id = s.id AND a.campus_code IS NULL;` migration is safe and idempotent.
- All fixes stay within the existing RLS model — no policy changes are required.

Tell me which items you want me to actually implement (everything, just the high‑priority block, or a custom subset) and I'll make the changes.
