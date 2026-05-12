# Calendar Module — Mobile Wrap Hardening

Goal: tighten the calendar so packaging it inside Capacitor (iOS + Android) feels native, with no jank, no hijacked gestures, no clipped overlays. No feature changes — only resilience tweaks.

## Findings

Scanned: `MonthGridCalendar`, `TimeGridCalendar`, `CalendarViewSwitcher`, `CalendarFiltersSheet`, `UpcomingEventsSection`, `CalendarPage`, `TeacherCalendarPage`.

| # | Risk | Where | Why it bites in native |
|---|------|-------|-----------------------|
| 1 | Horizontal scroll hijacks iOS edge-swipe-back | Week view `overflow-x-auto` (TimeGridCalendar L469) | Users swipe right from edge to go back, instead they scroll the week. |
| 2 | iOS rubber-band on horizontal scroll bleeds to page | same | Whole layout bounces sideways. |
| 3 | `title="..."` attrs on chip buttons | TimeGrid all-day & timed blocks, MonthGrid chips | iOS long-press shows native callout / text-select menu. |
| 4 | Tap targets below 44px | Mini-month day cells (28px), day-header circles (32px), month-strip pills (28px) | Misfires, especially with thumb at edge. |
| 5 | Sticky time gutter inside `overflow-x-hidden` page | TimeGrid L552 sticky inside AppLayout `overflow-x-hidden` | iOS Safari intermittently drops sticky when ancestor has overflow + transform. |
| 6 | Mini-month panel fixed `max-h-[420px]` | TimeGrid L412 | On iPhone SE / landscape, panel + day grid pushes content under bottom nav. |
| 7 | Hard-coded 7AM–19PM time window | TimeGrid props default | Events outside window clip silently — fine, but earlier/later school events vanish without indicator. |
| 8 | `toLocaleDateString("en-US", ...)` | UpcomingEventsSection L98 | OK for now, but locks formatting on devices with other locales. |
| 9 | Click handler on day-column wrapper `<div>` | TimeGrid L572 | Native tap delay + nested button propagation occasionally double-fires on Android WebView. |
| 10 | No swipe-to-navigate weeks/months | both grids | Not a bug, but expected affordance in native calendar apps. |

Capacitor config (`capacitor.config.ts`) is already correct: `androidScheme: "https"`, no `cleartext`, splash configured. AppLayout already applies `--safe-bottom` and `safe-px`. Nothing in calendar uses `window`, `localStorage`, or external URLs that would break in WebView.

## Proposed Changes

### TimeGridCalendar.tsx

- Wrap horizontal scroller with `touch-action: pan-y` on the inner area near the left edge (first ~16px gutter) so iOS edge-swipe-back wins. Practically: add a `overscroll-behavior-x: contain` class to the `overflow-x-auto` div, and `style={{ touchAction: "pan-x pan-y" }}`.
- Sticky gutter cells: keep `sticky left-0` but also add `will-change: transform` and ensure a solid `bg-card` (already there) with no parent transform. Document the constraint.
- Replace `title={b.title}` on event/chip buttons with `aria-label={b.title}` + `className` adding `select-none [-webkit-touch-callout:none]`.
- Mini-month panel: change `max-h-[420px]` to `max-h-[min(60vh,420px)]` and add `overflow-y-auto` so it never overlaps the day grid on short screens.
- Day-column wrapper: move the empty-cell tap handler from the outer `<div onClick>` to a sibling absolute-positioned transparent layer behind the chips (z-0), so chips above (z-10) don't need stopPropagation. Remove the wrapper-level onClick.
- Bump tap targets in the day header from `w-8 h-8` to `w-10 h-10` on mobile (`sm:w-8 sm:h-8`).

### MonthGridCalendar.tsx

- Same `aria-label` swap for chips (drop `title`).
- Add `select-none [-webkit-touch-callout:none]` to the cell button so long-press doesn't pop the iOS magnifier.
- Month-strip pills: enforce `min-h-9` and add `overscroll-behavior-x: contain` on the strip scroller.

### CalendarViewSwitcher.tsx

- Trigger button already 32px tall; widen hit area with `min-h-9 min-w-9` for thumbs.

### Page wrappers (`CalendarPage`, `TeacherCalendarPage`)

- No structural change. Add a small comment marker that the calendar relies on `--safe-bottom` from AppLayout.

### CSS / global (`src/index.css`)

- Add a single utility class `.no-callout { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }` to share between calendar buttons (avoid repeating the bracket utilities in markup).

### Out of scope (flagged for later)

- Swipe-to-navigate week/month (would need `framer-motion` drag handler and a confirm flow).
- Pinch-to-zoom hour density.
- Configurable `startHour`/`endHour` per school.
- Full i18n for date formatting.

## Files Touched

- `src/components/calendar/TimeGridCalendar.tsx`
- `src/components/calendar/MonthGridCalendar.tsx`
- `src/components/calendar/CalendarViewSwitcher.tsx`
- `src/index.css`

No data, RLS, or Supabase changes. Pure presentation hardening.

## Validation Plan

After implementation:
1. Mobile preview (390×733): week view scrolls horizontally; verify time gutter stays pinned; verify edge-swipe-back still works in iOS sim.
2. Long-press a chip on iOS — no callout menu appears.
3. Open mini-month picker on a 568px-tall viewport — panel scrolls instead of pushing day grid under bottom nav.
4. Tap each day in mini-month, day-header, and month-strip with thumb — no misfires.
5. Run `npx cap sync` and confirm no warnings.
