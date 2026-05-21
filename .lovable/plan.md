## Goal

Bring the same two quick-action buttons from the class Attendance module into the CCA session attendance view (used for both Clubs and Outdoor activities), so teachers can take club/outdoor attendance faster.

## Reference (existing pattern in `TeacherAttendancePage.tsx`)

Two side-by-side buttons above the student list:

1. **Mark all** — green outlined pill that sets every student to `present` in one tap.
2. **N unsaved / Unsaved** — toggle pill that filters the list down to only students who haven't been marked yet (and shows the remaining count). Active state uses the primary tint.

## Changes

### `src/components/cca/SessionAttendanceList.tsx`
- Add local state `showUnmarkedOnly` (boolean).
- Add `handleMarkAllPresent()` that loops through `students` and calls `setStudentStatus(s.id, "present")` for each.
- Above the student `<ul>`, render a `grid grid-cols-2 gap-2` row with two buttons matching the visual style from `TeacherAttendancePage.tsx` lines 591–621:
  - "Mark all" (emerald outline, Check icon) — disabled while `saving` or when `students.length === 0` or `!canEdit`.
  - "{N} unmarked" / "Unmarked" toggle (Filter icon) — active styling when on; count derived from `students.filter(s => !stateMap[s.id]?.status).length`.
- Replace the current `students.map(...)` with a filtered `visible` list:
  - When `showUnmarkedOnly` is true → only students whose `stateMap[s.id]?.status` is null.
  - Empty-state message: "All students marked. 🎉"
- Buttons only show when `canEdit` is true (parents/view-only see the existing summary chips only).
- Keep the existing summary chips, notes input, and Save button untouched.

### No other files

Both Clubs and Outdoor session attendance render through `SessionAttendanceList`, so this single component change covers both flows. Bus attendance (`BusAttendanceList`) is a separate per-leg flow and is out of scope unless you want it added too.

## Verification

- Open a Club session detail → see two new buttons; tap "Mark all" → every row turns green Present; tap "Unmarked" → list empties with the "All marked" message; un-mark one student → toggle shows "1 unmarked" and filter reveals only that student.
- Repeat on an Outdoor session.
- Parent / view-only role: buttons are hidden.
