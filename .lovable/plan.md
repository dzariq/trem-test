## Changes to `src/components/NotificationsDrawer.tsx`

### 1. Date pill format
Replace the current pill (weekday-on-top, big number below) with a single line: `15 May (Fri)`.
- Update `formatDatePill()` to return `"15 May (Fri)"` from `event_date`.
- Pill becomes a compact rounded chip (`px-2 py-1`, `text-[11px] font-semibold`, `bg-primary/10 text-primary`) instead of the 11×11 square.
- Applies to both the per-day rows inside week buckets and (where shown) other date references.

### 2. Buckets expanded by default
- Initialize `expandedBuckets` so every week bucket key (`this`, `next`, `later`) starts `true`.
- Chevron still toggles open/close; just the default flips.

### 3. Tap a date row → mark read + open calendar
- In the bucket row `onClick` handler:
  - If `!n.is_read` call `markAsRead(n.id)`.
  - Close the drawer (`onOpenChange(false)`) and `navigate("/calendar")` (parent) — already the route used elsewhere; route is determined by current path prefix so teacher path keeps working too. We'll use `/calendar` for parent and detect teacher via existing `isTeacher` prop fallback to `/teacher/calendar` if set.
- Keeps existing X dismiss button behavior unchanged.

### 4. "Next week" only surfaces on Monday
- In `groupedSections`, only include the `next` bucket when `new Date().getDay() === 1` (Monday).
- On other days, those events stay hidden from the drawer (they'll reappear once the calendar week rolls and they fall into `this week`, or next Monday's preview).
- `this week` and `later` buckets are unaffected.

### Out of scope
- No DB / hook / other-component changes.
- Synthetic "Today's schedule" and Monday "Week at a glance" cards stay as-is.
