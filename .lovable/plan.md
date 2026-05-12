## Calendar Month View — Taller Cells + Remove Day Section

### Changes

**1. Taller month grid cells (`MonthGridCalendar.tsx`)**
- Increase min cell height: `min-h-[88px] sm:min-h-[110px]` → `min-h-[128px] sm:min-h-[150px]` so 3 event chips fit comfortably with the date number.
- Change default `maxChipsPerDay` from `4` → `3`.
- Overflow indicator: when a day has more than 3 events, show the first 2 chips plus a compact "…" / "+N" pill (instead of "+N more" text row). Clicking it (or the cell) zooms into the Day view via existing `onZoomToDay`.
- Tapping any day cell already calls `onZoomToDay` — keep as-is so the overflow tap zooms naturally.

**2. Remove the bottom "selected day events" section**
- In `src/pages/CalendarPage.tsx` and `src/pages/teacher/TeacherCalendarPage.tsx`, remove the block under the Month grid that renders the selected day's heading ("Tuesday, May 12, 2026") and its event list / "No events scheduled for this date" empty state.
- Keep `selectedDay` state (still used for highlighting and zoom-to-day).

### Out of scope
- No changes to Week/Day views, filters, sheets, data hooks, or styling tokens beyond cell height.

### Files
- `src/components/calendar/MonthGridCalendar.tsx`
- `src/pages/CalendarPage.tsx`
- `src/pages/teacher/TeacherCalendarPage.tsx`
