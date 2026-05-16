## Problem

On `/parent/calendar` the page paints for a moment and then disappears (blank). HomePage works. No build errors in dev logs; `listCalendarEvents` returns 19 rows successfully. This pattern = an uncaught runtime error thrown during a follow-up render after data loads, with no Error Boundary to catch it.

## Likely culprits

`CalendarPage` mounts a lot of dependent hooks/components that fire after the first paint:

1. `useEligibleCcaActivities`, `useStudentCcaEnrollments`, `useCcaSessionsCalendar`, `useUpcomingCcaSessions` — any throw inside a `.map` (e.g. `picTeachers.map`, optional fields read as non-null) crashes the tree.
2. `NotificationsDrawer` (mounted via `AppHeader`) — recently edited; `formatRelativeDays(new Date(NaN))` would throw, and the synthetic-anchor sort/filter chain runs every render.
3. `MonthGridCalendar` / `UpcomingEventsSection` — first render uses empty arrays, second render uses real data; a bad event row (e.g. `event.tags` not array, `event.startDay` null) could throw inside `matchesCategory`/`matchesSubtype`/`UpcomingEventsSection`.
4. `EventDetailsSheet` rendered with `event={null}` initially — fine — but the `selectedEventDetails` union type (`UpcomingEvent | UpcomingCcaSession`) can throw if it reads CCA-only fields off an event.

## Fix plan

### 1. Add a route-level Error Boundary (the real fix for "disappears silently")

- Create `src/components/common/RouteErrorBoundary.tsx` (class component, `componentDidCatch` logs to console + shows a small "Something went wrong on this page" card with a Reload button).
- Wrap each `<Route element={...}>` body in `App.tsx` (at minimum the parent routes group) with `<RouteErrorBoundary>`. This stops the whole app from going blank and surfaces the actual stack to console so we (and the user) can see the real cause next time.

### 2. Instrument `CalendarPage` so the error is identifiable

- Wrap the body of `CalendarPage` in a local `<RouteErrorBoundary fallbackLabel="Calendar">`.
- Wrap each major subtree separately so we can isolate the offender:
  - Calendar tab: `MonthGridCalendar` / `TimeGridCalendar` + `UpcomingEventsSection`.
  - CCA tab: enrolled list + available list.
  - Bottom sheets (`CcaDetailsSheet`, `EventDetailsSheet`, `ClubSwitchConfirmDialog`, `CalendarFiltersSheet`).

### 3. Harden the most likely throw sites

- `CalendarPage.matchesCategory` / `matchesSubtype`: guard `event.tags` with `Array.isArray(event.tags) ? event.tags : []` and treat missing `category`/`eventType`/`title` as empty strings (already mostly done — verify).
- `NotificationsDrawer`:
  - In `parseSyntheticAnchorDate`, also reject invalid month/day (e.g. `02-30`) and return `null` for `isNaN(date.getTime())`.
  - In `formatRelativeDays`, return `""` if `date` is invalid instead of producing `NaN days ago`.
  - In the unified sort, fall back to `0` when `created_at` is missing/invalid.
- `EventDetailsSheet`: render `null` when `event` is null OR when it doesn't have the minimum fields it reads.

### 4. Verify

- Reload `/parent/calendar` in the preview — page must stay on screen.
- If the boundary fallback shows, the console will contain the real stack; fix the specific component and remove the temporary inner boundaries afterward (keep the top-level one).

## Out of scope

- No business-logic / data-shape changes in `data/calendar.ts` (the data already loads).
- No UI redesign — only defensive null/array guards and the new boundary component.

## Files to touch

- New: `src/components/common/RouteErrorBoundary.tsx`
- Edit: `src/App.tsx` (wrap routes)
- Edit: `src/pages/CalendarPage.tsx` (inner boundaries + small guards)
- Edit: `src/components/NotificationsDrawer.tsx` (date guards)
- Edit: `src/components/events/EventDetailsSheet.tsx` (null guard, if needed after inspection)
