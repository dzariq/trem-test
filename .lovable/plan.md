# Expandable Month Header for Day/Week Views

Inspired by Google Calendar mobile: tapping the month name in day/week view expands a compact month grid (with event dots) plus a horizontal month-strip selector. Tapping a day jumps the time grid; tapping a month jumps the visible range.

## Scope

Only the header area of `TimeGridCalendar.tsx` (used for week + day views). Month view is untouched. No data layer changes.

## UX behavior

1. The "May" / "March" title in the header becomes a button with a small chevron (▾ collapsed, ▴ expanded).
2. Tapping it slides down a panel containing:
   - **Mini month grid** for the currently displayed month (Mon-first, matches existing weekday order). Selected day = filled primary circle. Today = primary text. Other days = foreground.
   - Each day cell shows a **single small dot** centered below the number when that day has at least one event or CCA session (color: `bg-primary`, ~4px). No multi-color stacking — keep it minimal like Google.
   - Below the grid: a **horizontal scrollable month strip** (Jan–Dec for the current year, with the active month highlighted in a soft primary pill).
3. Tapping a day in the mini grid → calls `onSelectDay` and `onDateChange` with that date, then collapses the panel.
4. Tapping a month in the strip → `onDateChange` to the 1st of that month (preserving day-of-month when possible, clamped), keeps panel open.
5. Default state = collapsed. State is local to `TimeGridCalendar` (no parent prop changes required).
6. Panel animates with a simple max-height/opacity transition (Tailwind `transition-all`). No new deps.

## Component changes

### `src/components/calendar/TimeGridCalendar.tsx`
- Add `useState<boolean>` for `monthPickerOpen`.
- Wrap the existing `headerLabel` `<div>` in a `<button>` that toggles state, append a `ChevronDown` (rotates 180° when open).
- After the header row, before the scrollable time area, render a collapsible `<div>` with `max-h-0 / max-h-[420px]` transition.
- Inside the panel, build a new local `MiniMonthGrid` subcomponent (kept in same file for cohesion):
  - Computes weeks for `date.getMonth()` (Mon-first), using existing `toYmd` / `parseYmd`.
  - Receives a `Set<string>` of YMDs that have events, derived once from `events` + `ccaSessions` props (covering the visible month range — reuse existing per-day expansion logic; quick pass over `events` checking `startDay`..`endDay` overlap with the month, plus session dates).
  - Renders a 7-col grid; out-of-month days dimmed.
- Below grid, render the month strip: horizontally scrollable flex row of 12 buttons (`Jan`…`Dec`), active one styled as a soft primary pill matching the existing rounded-full button language already used elsewhere.

### `src/components/calendar/MonthGridCalendar.tsx`
- No change. Month view already shows full event chips.

## Visual tokens

- All colors via existing semantic tokens: `bg-primary`, `text-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted/30` for the panel background.
- Match the rounded `rounded-xl` card surface and existing typography scale.

## Out of scope

- No swipe-down gesture (tap-to-toggle only, like Google's tap behavior).
- No multi-color event dots — single primary dot keeps the mini grid clean.
- No persistence of expanded state across navigations.
