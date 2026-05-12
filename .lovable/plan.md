## Calendar Redesign — Grid Layout + Multiple Views

Refine `MonthGridCalendar` and add a view switcher so the calendar feels like a proper desktop/mobile calendar app (Google Calendar / Apple Calendar style).

### 1. Week starts Monday
- Change `WEEKDAYS` from `Su Mo Tu We Th Fr Sa` → `Mo Tu We Th Fr Sa Su`.
- Update `startOffset` calc: `(firstOfMonth.getDay() + 6) % 7` so Monday = 0.

### 2. True grid (not rounded chips)
Replace the gap-based rounded cells with a hairline grid:
- Outer container: rounded card border, `overflow-hidden`.
- Grid: `gap-0`, each cell uses `border-r border-b border-border` (last col drops right border, last row drops bottom).
- Weekday header row: same border treatment, `bg-muted/30`, uppercase 11px labels.
- Day cells: square-ish (`min-h-[92px]` mobile, `min-h-[120px]` sm+), no per-cell rounding, no per-cell border radius.
- Day number: top-left, plain number; today = filled primary circle (5×5); selected = thin primary ring on the cell (inset, no offset).
- Outside-month days: faded number, no background tint.
- Event chips: keep colored pill style, slightly tighter (`h-[18px]`, `text-[10px]`, `rounded-[3px]`), full-width, truncated.
- Multi-day events: visually continuous look — no left radius if continued from prior day, no right radius if continues. (Stretch: keep simple per-day chip for v1, document continuous-bar as follow-up.)

### 3. View switcher
Add a segmented control above the grid: **Month · Week · Day** (mobile) / **Month · Week · Day · Agenda** (sm+).

Component: new `src/components/calendar/CalendarViewSwitcher.tsx` — segmented pill with active state using primary token.

State: `view: "month" | "week" | "day" | "agenda"` lifted into `TeacherCalendarPage` and `CalendarPage` (URL-synced via `?view=` is out of scope for v1, just local state).

#### Month view
The redesigned `MonthGridCalendar` above.

#### Week view (new `WeekGridCalendar.tsx`)
- Header row: 7 day columns (Mon–Sun) with date number + weekday short label; today highlighted.
- Body: time-axis on the left (hourly rows 7am–7pm by default), 7 columns; events render as positioned blocks based on `start_time`/`end_time`.
- All-day events sit in a thin row above the time grid.
- Tap a block → opens `EventDetailsSheet` / `SessionDetailsSheet` (reuse existing handlers).
- Mobile (390px): horizontal scroll for the 7 columns OR collapse to a 3-day visible window with swipe — v1 = horizontal scroll with sticky time gutter.

#### Day view (new `DayAgendaView.tsx`)
- Full-width single column, hourly rows, same event-block rendering as week view.
- All-day strip at top.
- Date stepper header (◀ Wed, Jun 3 ▶).

#### Agenda view (sm+ only, optional v1)
- Flat chronological list grouped by date — reuses existing `UpcomingEventsSection` styling.

### 4. Wire-up
`TeacherCalendarPage.tsx` and `CalendarPage.tsx`:
- Add `view` state, render `<CalendarViewSwitcher>` above the calendar surface.
- Conditionally render `<MonthGridCalendar>` / `<WeekGridCalendar>` / `<DayAgendaView>`.
- All views receive the same `events`, `ccaSessions`, `selectedDay`, click handlers — no data fetching changes.
- Selecting a day in Month view + tapping the view switcher → switches into Week/Day around that day.

### 5. Files
- Edit: `src/components/calendar/MonthGridCalendar.tsx` (Mon-start + true grid styling)
- New: `src/components/calendar/CalendarViewSwitcher.tsx`
- New: `src/components/calendar/WeekGridCalendar.tsx`
- New: `src/components/calendar/DayAgendaView.tsx`
- Edit: `src/pages/teacher/TeacherCalendarPage.tsx`, `src/pages/CalendarPage.tsx` (view state + switcher + conditional render)

### Out of scope (v1)
- Continuous multi-day event bars spanning across cells (per-day chips for now)
- Drag-to-create / drag-to-reschedule
- URL sync of `?view=` and `?date=`
- Search icon in the header from the reference
