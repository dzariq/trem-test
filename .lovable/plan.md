## Calendar Header Reorg + Collapsible Filters

### New header layout (inside `MonthGridCalendar` and `TimeGridCalendar`)

```text
[ May 2026 ]  [ Month ▾ ]  [ ⛃ Filter ]   ........   [ < ]  [ > ]
```

Left cluster (grouped tight): month/date label → view dropdown → filter button.
Right cluster: prev / next arrows. (Day/Week views also keep the existing `[← Back]` button at the far left.)

### Filter button → bottom sheet

- Replace the row of filter pills currently rendered above the calendar in `TeacherCalendarPage.tsx` and `CalendarPage.tsx`.
- New `Filter` icon button (lucide `SlidersHorizontal`) in the calendar header, with a small badge dot when any filter is active.
- Tapping it opens a bottom sheet (`@/components/ui/sheet` `side="bottom"`) titled "Filter events" containing:
  - The existing "All" toggle
  - The existing `CategoryFilterPill` row (full set, wrapped)
  - "Apply" / "Reset" footer (Reset = All selected)
- Sheet state (`filtersOpen`) lives on the page; filter state and handlers stay where they are today (no logic change).

### Wiring

- `MonthGridCalendar` and `TimeGridCalendar` get new optional props: `onOpenFilters?: () => void`, `hasActiveFilters?: boolean`.
- Both pages pass `onOpenFilters={() => setFiltersOpen(true)}` and `hasActiveFilters={!isAllSelected}`.
- Remove the existing `<div className="flex flex-wrap gap-1.5 pb-2">…pills…</div>` block from both pages; move that exact JSX into the new sheet content (extracted as a small `CalendarFiltersSheet` component to avoid duplication between teacher and parent pages).

### Out of scope
- No changes to filter logic, event/CCA data, day-zoom behavior, or styling of the pills themselves.
- No changes to the Upcoming Events section.

### Files
- `src/components/calendar/MonthGridCalendar.tsx` — header layout + filter button
- `src/components/calendar/TimeGridCalendar.tsx` — header layout + filter button
- `src/components/calendar/CalendarFiltersSheet.tsx` — new, wraps All + CategoryFilterPill row in a bottom sheet
- `src/pages/teacher/TeacherCalendarPage.tsx` — remove pill row, add sheet, pass props
- `src/pages/CalendarPage.tsx` — same
