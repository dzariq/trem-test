# Calendar UX improvements

## Goals
1. Remove the standalone Month/Week/Day segmented switcher above the calendar.
2. Put view selection inline with the date navigation row, as a compact dropdown.
3. Tapping any day cell in Month view zooms into Day view for that date.
4. Add a Back button (in Day/Week view) to return to Month view.

## Layout changes

### Header row inside the calendar card (`MonthGridCalendar` + `TimeGridCalendar`)
New unified row, left-aligned title + right-aligned controls:

```text
[ < ]  May 2026  [Month ▾]                           [ > ]
```

In Day/Week view:

```text
[ ← Back ] [ < ]  Fri, May 22  [Day ▾]               [ > ]
```

- Title (month/date label) moves to the left, next to the prev arrow.
- A small dropdown (shadcn `Select` or `DropdownMenu`) shows current view; options: Month, Week, Day.
- Back button only renders when `view !== "month"`; clicking it sets view back to `month` and keeps `selectedDay` so the user lands on the same month.

### Pages (`TeacherCalendarPage.tsx`, `CalendarPage.tsx`)
- Remove the `<CalendarViewSwitcher />` block above the calendar.
- Pass `view`, `onViewChange`, and `onBackToMonth` into the calendar components so the controls live inside the calendar header.
- Keep `view` state in the page (unchanged).

## Behavior

### Tap day in Month view → zoom to Day
- In `MonthGridCalendar`, when a user taps a day cell (not a chip):
  - Update `selectedDay` to that ymd.
  - Call new `onZoomToDay(ymd)` prop → page sets `view = "day"` and sets the reference date to that ymd.
- Tapping a chip keeps current behavior: opens the event/session sheet, does NOT zoom.
- If the tapped day is in the previous/next month, also update the visible month (already handled).

### Back button
- Visible only when `view !== "month"`.
- Resets `view` to `"month"`.
- Preserves `selectedDay` so the month grid scrolls/highlights the same date.

### Dropdown
- Compact trigger: current view label + chevron, ~h-8, rounded-md, subtle border.
- Selecting Week/Day from Month uses `selectedDay` (or today if none) as the anchor date.
- Selecting Month from Week/Day returns to the month containing the current anchor date.

## Files to touch
- `src/components/calendar/MonthGridCalendar.tsx` — new header layout (title left, dropdown + back inline), `onZoomToDay`, `onViewChange`, `view` props; cell click triggers zoom.
- `src/components/calendar/TimeGridCalendar.tsx` — new header layout with Back button, dropdown, prev/next; accepts `view`, `onViewChange`, `onBackToMonth`.
- `src/components/calendar/CalendarViewSwitcher.tsx` — repurpose into a small `CalendarViewDropdown` (or replace) returning a dropdown trigger; keep `CalendarViewMode` type export.
- `src/pages/teacher/TeacherCalendarPage.tsx` — remove standalone switcher, wire new props (`onZoomToDay`, `onBackToMonth`, `view`, `onViewChange`).
- `src/pages/CalendarPage.tsx` — same changes as teacher page.

## Out of scope
- No changes to filters, event data, or sheets.
- No animation/zoom transition (instant view swap).
- No URL sync of view/date.
