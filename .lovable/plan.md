## Goal

Replace the current "dot-only" month calendar on the Calendar page with a richer grid where each day cell shows up to 4 event chips (title only, color-coded), plus a "+N more" indicator when there are extra events. Tapping a day still opens the full list below as it does today.

Applies to both:
- `src/pages/teacher/TeacherCalendarPage.tsx` (Teacher /teacher/calendar)
- `src/pages/CalendarPage.tsx` (Parent /calendar)

## What changes visually

Reference: the uploaded mobile calendar screenshot (chips stacked inside each day cell, "..." for overflow).

Each day cell will show:
- Day number (top of cell, smaller)
- Up to **4 event chips** — short colored bar with truncated title (`truncate`, ~1 line)
- If more than 4 events on that day → show `+N` pill on the last row instead of the 4th chip (so total visible rows stays = 4)
- Multi-day events (e.g. May 22–23) appear on every day they span, using the same color
- CCA sessions are shown as chips too (tagged "CCA" color)
- Today: ring highlight on the day number; selected day: filled background on the cell
- Empty days: just the day number, muted

Chip color comes from the existing `getEventBadgeColor` / `getCcaTypeColor` helpers so it stays consistent with the badges in the day-detail list and Upcoming section.

The detail card below ("Friday, May 22, 2026 — events…") and the "Upcoming Events" section stay exactly as they are. Tapping a chip opens the same `EventDetailsSheet` already used today.

## Layout sizing (mobile 390px)

- Replace `react-day-picker`'s fixed `h-9` day buttons with a custom 7-col CSS grid built directly inside the Calendar Card.
- Cell height: `min-h-[88px]` on mobile, `min-h-[110px]` on `sm:` and up.
- Chip height: `h-4` (16px), text `text-[10px]`, `px-1`, `truncate`.
- Header row stays: month title + prev/next chevrons (reuse current pattern).
- Weekday header row: `Su Mo Tu We Th Fr Sa`.

This means we stop using `<Calendar>` (shadcn DayPicker wrapper) on this screen and render our own month grid component. DayPicker is still used elsewhere (date inputs) — we leave that untouched.

## New component

Create `src/components/calendar/MonthGridCalendar.tsx`:

Props:
```
{
  month: Date;
  selectedDay: string;            // YYYY-MM-DD
  onSelectDay: (ymd: string) => void;
  onMonthChange: (date: Date) => void;
  events: UpcomingEvent[];        // already filtered
  ccaSessions: CcaCalendarSession[]; // already filtered
  onEventClick: (event: UpcomingEvent) => void;
  onSessionClick: (session: CcaCalendarSession) => void;
  maxChipsPerDay?: number;        // default 4
}
```

Internals:
- Build a `Map<ymd, Array<ChipItem>>` once per render, where `ChipItem` = `{ kind: "event" | "cca", title, colorClass, payload }`.
- For each event, walk from `startDay` to `endDay` (inclusive) and push to every day's bucket.
- Sort each day's bucket by: all-day first, then start time, then title.
- Generate the 6-row × 7-col grid for the visible month (including leading/trailing days from adjacent months, rendered muted).
- For each cell:
  - Header: day number + (today indicator)
  - Up to `maxChipsPerDay - 1` chips, then a `+N` pill if `bucket.length > maxChipsPerDay`; otherwise show all (up to `maxChipsPerDay`).
- Click on the cell area (not on a chip) → `onSelectDay(ymd)`.
- Click on a chip → `onEventClick` / `onSessionClick` and stopPropagation.

## Wire-up changes

In both `TeacherCalendarPage.tsx` and `CalendarPage.tsx`:

1. Replace the `<Card>` wrapping `<Calendar mode="single" …>` with `<MonthGridCalendar … />`.
2. Pass through the same `filteredEvents`, `ccaSessions` (filtered for parent's selected student where applicable), `selectedDay`, `currentMonth`, and the existing `setSelectedDay` / `setCurrentMonth` handlers.
3. Pass `openEventDetails` (already exists) for `onEventClick` and the CCA session opener for `onSessionClick`.
4. Remove the now-unused `hasEventsSet` / `eventDaySet` / `addRangeDays` block — the grid builds its own per-day buckets.
5. Keep the per-day detail Card and Upcoming section beneath unchanged.

## Multi-day & all-day handling

Already correct in `src/data/calendar.ts` (startDay / endDay normalized for SGT and inclusive end at next-day midnight). The new grid relies on those fields, so May 22–23 type events render chips on both days automatically.

## Edge cases

- Months with 6 visible weeks → grid renders 6 rows; with 4-5 weeks → render only the needed rows so the card height adapts.
- Outside-month days are still clickable (selecting one switches `currentMonth`).
- If `events.length === 0` on a day, no chips render; cell stays empty but selectable.
- Long titles: `truncate`. Hover/long-press on desktop is not required (mobile-first).
- Color contrast: keep using existing semantic `getEventBadgeColor` classes (already designed for both light/dark).

## Out of scope (not changing)

- Filter pills, CCA tab, Upcoming Events section, EventDetailsSheet, SessionDetailsSheet — all unchanged.
- The shared `<Calendar>` (DayPicker) wrapper stays in place for any other date pickers in the app.
- No DB / RLS / data-shape changes.

## Files touched

- `src/components/calendar/MonthGridCalendar.tsx` (new)
- `src/pages/teacher/TeacherCalendarPage.tsx` (swap calendar component + cleanup)
- `src/pages/CalendarPage.tsx` (swap calendar component + cleanup)
