## Problem

The shared Supabase schema changed: `calendar_events.event_category` used to be a text label (e.g. `"exam"`, `"holiday"`); it is now a **uuid foreign key** into a new `event_categories` table. The other Lovable project (web admin) was updated to match, but the mobile app still treats `event_category` as a string. Result: events fetch correctly, but every tab/filter that runs `category.includes("exam"/"holiday"/"event"/...)` matches against a UUID string and silently fails — the calendar looks broken / empty / mis-bucketed.

Fix is purely client-side. No Supabase changes, so the other project is untouched.

## Scope

Files to update (3):
- `src/data/calendar.ts` — fetch the category name via join, expose it as the event's `category`.
- `src/lib/calendarFilters.ts` — small refinement to the keyword buckets so the new full names ("Mid-Year Exam", "Public Holiday", "Field Trip", "Internal Event", "Parent–Teacher Conference", etc.) classify into the right tab.
- `src/hooks/useNotifications.ts` — same join (it also reads `calendar_events`) so notifications keep working.

Out of scope: BO has 0 calendar rows in the DB — that's a content gap on the other project's side. The app will simply show its empty state when toggled to BO.

## Steps

1. **Resolve the category name (data layer)**
   - In `listCalendarEvents` and `listUpcomingEvents`, change the select to:
     `select("*, event_categories:event_category(name, color, sort_order)")`.
   - In `mapCalendarRow`, derive `category` from, in order:
     `row.event_categories?.name` → `row.event_type` → `"general"`, then lowercased.
   - Keep `eventType` populated from `row.event_type` (subtype mapping still uses it).
   - Optionally surface the category color so cards/badges can use the admin-defined hue later (no UI change required now).

2. **Tighten filter keyword matching (`calendarFilters.ts`)**
   - Extend the `isExamEvent` / `isHolidayEvent` / `isEventsEvent` keyword lists to cover the names actually used in `event_categories`:
     - exam: `exam`, `test`, `assessment`, `checkpoint`, `igcse`, `mye`
     - holiday: `holiday`, `term break`
     - event: `event`, `field trip`, `open day`, `workshop`, `conference`, `ptc`, `family`, `team building`, `back to school`, `celebration`
     - academic: `extra class`, `enrichment`, `due date`
   - Same additions inside `filterEventsByTypes`.
   - No UI change to filter chips.

3. **Notifications hook**
   - In `src/hooks/useNotifications.ts`, update the calendar fetch to also join `event_categories(name)` and use the resolved name where the previous code used `event_category` as text (so notification routing and labels stay correct).

4. **Smoke test in preview**
   - Toggle to GL: confirm events appear in the month grid, exam dates land in the Exam tab, public holidays land in the Holidays tab, field trips/PTC land in the Events tab.
   - Toggle to BO: confirm graceful empty state (no errors).
   - Confirm notifications still surface upcoming events.

## Risk / Compatibility

- No DB writes, no migrations, no RLS changes → other Lovable project is unaffected.
- The new `select(..., event_categories:event_category(...))` requires the FK to exist (it does). If a future row has `event_category = NULL`, we still fall back to `event_type`, so nothing breaks.
