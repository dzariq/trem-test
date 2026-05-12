## Redesign week/day view to Google Calendar Material 3 mobile style

Rework `src/components/calendar/TimeGridCalendar.tsx` to match the reference (Google Calendar mobile, image-503).

### Visual direction

```text
                Mon         Tue         Wed         Thu
                 1          (2)          3           4
                          ╲ today circle ╱

       PH 10 (Ago…)   RPH 9 (Re…)   EX4 (MYE)    AHM           ← all-day chips, no label cell

7 AM   ┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐
       │      │     │      │     │      │     │      │
8 AM   ├──────┤     ├──────┤     ├──────┤     ├──────┤
       │      │     │      │     │      │     │      │
9 AM   └──────┘     └──────┘     └──────┘     └──────┘
```

Key rules from the reference:
- No tinted "header row" rectangle and no tinted gutter column. The page background shows through everywhere.
- Day header floats above the columns: small uppercase weekday on top, big date underneath. Today's date is rendered inside a filled primary-color circle. Selected (non-today) day uses an outlined circle.
- "All Day" label cell is removed. All-day events sit as colored pills directly under the day header, in their day column, no row label.
- Time labels (`7 AM`, `8 AM`…) sit in the left margin as small muted text aligned to the gridline, with no background tint and no right border.
- Each hour × day cell is its own rounded card (white/`bg-card`, subtle `border-border/60`, `rounded-lg`), separated by horizontal and vertical gaps so they read as individual chips, not a continuous grid.
- No vertical column dividers, no horizontal hour dividers — the gaps between rounded cells provide the rhythm.
- Today's column gets a very subtle primary tint behind the cells (optional, matches Google's accent column).
- Timed event blocks keep absolute positioning over the cell stack, with the same color/shape they have today (rounded, shadow, colored bg).

### Files to change

- `src/components/calendar/TimeGridCalendar.tsx`
  - Remove `bg-muted/40` from header row, gutter, and "All Day" label cell
  - Delete the "All Day" label cell entirely; render all-day chips in a row of day-column cells with no first-column label
  - Replace the time-gutter `<div>` with absolutely positioned hour labels overlaid in a narrow left margin (no border, no bg)
  - Replace the single absolute "rounded hour cell" per hour with a per-(day, hour) rounded card grid: each card is `bg-card border border-border/60 rounded-lg` with small inset (`left-1 right-1 top-1 bottom-1` style spacing using padded wrappers, or render via a CSS grid of cells with gap)
  - Day header: switch to two-line layout (small uppercase weekday + big date), wrap today's date in a filled `bg-primary text-primary-foreground` circle (~28px), selected non-today uses ring outline
  - Drop the spacer row between all-day strip and time grid (no longer needed because there are no continuing borders)
  - Keep timed event blocks absolutely positioned over the cell stack, same color logic

### Out of scope

- No changes to month view (`MonthGridCalendar`)
- No changes to filter/header bar above the calendar (June, view dropdown, filter, prev/next stay as-is)
- No changes to event/CCA data, click-to-zoom behavior, or detail sheets
- No new colors added — only existing semantic tokens (`bg-card`, `bg-primary`, `border-border`, `text-muted-foreground`)
