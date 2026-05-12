## Goal
Redesign the student-list card header on `/teacher/attendance` so the title row is centered and the action buttons fill the row evenly.

## Changes (single file: `src/pages/teacher/TeacherAttendancePage.tsx`)

**Row 1 — Class + student count (centered)**
- Center horizontally (replace `justify-between` with `justify-center`).
- Replace the dark muted pill for student count with a light/white chip: white background, subtle border, `Users` icon + number inside. Same look-and-feel as a normal cell.
- Both the class name (`GL-NC`) and the student-count chip sit side-by-side, centered.

**Row 2 — "Mark all" + "unsaved" buttons (50/50)**
- Move both buttons onto their own row below the title.
- Use `grid grid-cols-2 gap-2` so each button takes exactly half the width.
- Each button becomes `w-full`, centered content, height stays mobile-friendly (h-10).
- Change the corner radius from fully rounded (`rounded-full`) to `rounded-xl` to match the 4 status buttons (Present/Absent/Late/Excused) in the student rows below.
- Keep existing colors: emerald tint for "Mark all", neutral/primary-tinted for "unsaved" toggle.

**Loader placement**
- The small spinner currently sits inline with buttons; move it next to the centered title so it doesn't disturb the 50/50 grid.

## Out of scope
- No changes to button behavior, icons, labels, or the student rows below.
- No changes to summary cards, class/date selectors, or statistics tab.

```text
Before:                          After:
[GL-NC (pill 8) ✓Markall ▽uns]   [   GL-NC  · 8 students   ]
                                 [  ✓ Mark all | ▽ unsaved  ]
```
