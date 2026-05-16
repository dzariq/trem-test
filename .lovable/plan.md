# Parent Attendance — Audit Findings & Fix Plan

## What I checked (deep audit)

1. **Network** — The Supabase REST call for `/attendance?student_id=eq.<id>` returns **HTTP 200** with body `[]`. No RLS error, no 401/403, no timeout.
2. **Console** — Logs say `[attendance] Fetched 0 rows`. No JS errors.
3. **RLS policies on `public.attendance`** — Two SELECT policies allow parents:
   - `Scoped attendance access` → admin OR teacher OR `student_guardians` link
   - `parents_can_read_linked_students_attendance` → `student_guardians` link
   Both correctly join via `student_guardians.guardian_user_id = auth.uid()`.
4. **Guardian link** — The currently logged-in parent (`fa15c909…`) is correctly linked to 3 students via `student_guardians`:
   - KARTI SAI (GL-Y4C)
   - SESHIAN (GL-Y6C)
   - DEEVESHWAR (GL-Y7I)
5. **Actual DB rows** — Ran `SELECT COUNT(*) FROM attendance WHERE student_id IN (...)` for all three children: **0 rows each.**
6. **Classes** — Attendance HAS been marked for class `GL-Y7I`, but only for student `ZHANG BOXUAN`. None of this parent's children appear in any attendance record anywhere in the DB.

## Root cause

**The backend is working perfectly. The data simply does not exist.** Teachers have not marked attendance for KARTI / SESHIAN / DEEVESHWAR. So the page loads → fetches → returns `[]` → renders an (almost) empty chart + a tiny "No attendance records for this month" line, which visually reads as "blank."

The page is not broken — the empty state is just too quiet.

## Fix plan (UX only, no backend changes needed)

1. **Chart empty state** — When `records.length === 0` after loading, replace the empty zero-bars chart with a clear empty-state card:
   - Icon + headline: "No attendance recorded yet"
   - Sub-copy: "Your child's teacher hasn't marked any attendance for [student name] yet. Records will appear here once class attendance starts being taken."
2. **Monthly summary card** — When all four counters are 0, show the same empty-state messaging instead of four "0" tiles which look broken.
3. **Daily breakdown** — Keep the existing "No attendance records for this month." but upgrade the styling so it reads as intentional (centered, icon, muted card) rather than a stray line of text.
4. **Loading → empty transition** — Add a short stable-state guard so the loader doesn't flicker off into a near-blank page (currently `isLoading` flips to false → user sees a chart full of zeros → confused).

No DB migration, no RLS change, no query change.

## Technical notes

- File: `src/pages/AttendancePage.tsx` — add `hasAnyData = records.length > 0` derived from `useParentAttendance`, branch the chart/summary/breakdown render on it.
- Hook `useParentAttendance` already exposes `records` and `loading` — no hook changes required.
- Optionally: in dev, surface the existing `DebugPanel` toggle hint so future "blank" reports can be diagnosed by enabling `localStorage.dev_debug = '1'`.

## Out of scope

- Seeding mock attendance for these three students (let me know if you want that — it's a one-line SQL insert).
- Changing teacher attendance marking flow.
