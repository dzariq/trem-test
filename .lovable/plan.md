## Audit Findings: Calendar event duplication / wrong-date issue

### What you're seeing
On the mobile app's May 2026 calendar, every weekday in May appears to have an event, and several events are duplicated one day earlier than the web admin shows. Example you flagged: "Y9 MYE Starts" appears on **May 5** in the app, but the source-of-truth is **May 6**.

### Root cause: timezone handling, NOT duplicated rows in Supabase
There is **no duplicated data in Supabase**. Each event exists as a single row. The bug is entirely in the mobile app's date parsing.

Looking at the raw `calendar_events` rows for May 2026:

| Title | start_date (UTC) | end_date (UTC) | campus |
|---|---|---|---|
| Y9 MYE Starts | `2026-05-05 16:00:00+00` | `2026-05-06 15:59:59+00` | GL |
| Y1-2 MYE Ends | `2026-05-12 16:00:00+00` | `2026-05-13 15:59:59+00` | GL |
| Y1-2 MYE Ends | `2026-05-13 00:00:00+00` | `2026-05-13 00:00:00+00` | BO |
| OHM | `2026-05-17 16:00:00+00` | `2026-05-18 15:59:59+00` | GL |

Two different storage conventions are used by the admin portal:
1. **GL campus** events store all-day events as **Singapore midnight expressed in UTC**, i.e. `previous-day 16:00:00+00 → that-day 15:59:59+00`. Correctly interpreted in SGT (UTC+8), this is one local day.
2. **BO campus** events store all-day events as **UTC midnight**, i.e. `that-day 00:00:00+00`.

The mobile app's `mapCalendarRow` in `src/data/calendar.ts` does this:
```ts
const startDay = startDateTime ? String(startDateTime).slice(0, 10) : "";
const endDay   = endDateTime   ? String(endDateTime).slice(0, 10)   : startDay;
```
It just **string-slices the first 10 chars of the UTC timestamp** — it never converts to the local timezone. So a GL event meant for May 6 gets `startDay="2026-05-05"` and `endDay="2026-05-06"`.

Then in both `TeacherCalendarPage.tsx` and `CalendarPage.tsx`, `addRangeDays(startDay, endDay)` walks every day in that range and marks each one as "has event". Result: the GL event lights up **both May 5 and May 6**, and `eventsOnSelectedDate` returns it on both days. That's the "duplication" you see — same event, two consecutive days.

The web admin doesn't have this bug because it converts the timestamps to the local timezone before extracting the date.

### Why every May day looks occupied
Because every GL all-day event spans two UTC days (the day before + the actual day) under this slicing logic, the gaps between back-to-back real events get filled in. That's why May 5, 7, 12, 21 etc. appear occupied even though the source data has nothing on those days.

### Same bug also affects
- The "has events" dot/highlight on the month grid (`hasEventsSet`)
- The events list under "Events for selected date"
- `UpcomingEvents` widget on home pages and `listUpcomingEvents`
- Parent `CalendarPage` — same `mapCalendarRow` is used

### The fix (single source of truth)
Update `mapCalendarRow` in `src/data/calendar.ts` to derive `startDay`/`endDay` in **Asia/Singapore** local time instead of slicing the UTC string. Also normalize `is_all_day` so that a GL-style range (`16:00:00+00 → next-day 15:59:59+00`) collapses to a single local day.

```text
GL row:  start=2026-05-05T16:00Z end=2026-05-06T15:59:59Z
         → local SGT: 2026-05-06 00:00 → 2026-05-06 23:59
         → startDay="2026-05-06", endDay="2026-05-06"  ✓

BO row:  start=2026-05-13T00:00Z end=2026-05-13T00:00Z is_all_day=true
         → keep as 2026-05-13 (single day)             ✓
```

Concretely:
1. Add a small `toLocalYmd(iso, tz="Asia/Singapore")` helper.
2. In `mapCalendarRow`, compute `startDay`/`endDay` via that helper.
3. For all-day events where the raw end is exactly `next-day 15:59:59+00` relative to start, treat `endDay = startDay` (single-day all-day).
4. Drop the now-unnecessary `isMidnightUtc` heuristic; rely on `row.is_all_day` plus the local-day calculation.

No Supabase migration needed — purely a frontend display fix. The `time` label formatting (`formatTimeLabel`) already uses the user's local timezone via `toLocaleTimeString`, so timed events keep working.

### Verification after the fix
- May 5, 7, 12, 21 should be **empty** on the mobile calendar (matches admin).
- "Y9 MYE Starts" should appear **only on May 6**.
- "Y1-2 MYE Ends" (GL + BO) should both land on May 13 — and de-dup logic in `dedupeRows`/`getEventDedupeKey` will then collapse them as expected since `startDay` will match.

### Out of scope
No changes to Supabase schema, RLS, or admin portal. No business-logic changes — this is a presentation-layer timezone bug only.