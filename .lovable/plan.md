# Notifications Module — Audit & Fix

## What's actually happening

Two parallel "digest" systems exist and are stepping on each other:

| Source | What it produces | Where |
|---|---|---|
| **DB cron** `create_weekly_calendar_digest` (Sun 23:00) → writes to `notifications` table with type `weekly_digest` | "**This week at school** — 1 event (18 May – 24 May)…" | `supabase/migrations/20260515061346…sql` |
| **Client synthetic** in `NotificationsDrawer.tsx` (computed at render time from calendar events) | "**Week at a glance** — Mon…" and "**What's on** — Tue, May 19" | `src/components/NotificationsDrawer.tsx` lines 220–300 |

So every Monday, parents see **both** "This week at school" (DB cron) and "Week at a glance" (client) — that's the duplicate in your screenshot.

Second bug — the client loop generates a "What's on — <day>" item for **every day of this week and next week that has any event**, then tries to hide future ones with a `<= today` filter (line 311-315). That filter is comparing local Date objects parsed from `dayKey` and is letting tomorrow leak through in the screenshot (Tue May 19 visible on May 18).

Third issue — Monday currently shows both the weekly digest **and** a "What's on today" for Monday, double-coverage.

## Desired behaviour (from your message)

- **Kill** "This week at school" entirely. Only "Week at a glance" survives as the weekly digest.
- **Monday** → only **"Week at a glance"** for that week. **No Monday daily digest.**
- **Tue–Sun** → only **"What's on — <that weekday>"** for **today**. No past days, no future days.
- Rinse and repeat the next week (Monday again only weekly, etc.).

## Changes

### 1. Remove the DB weekly digest

New migration:
- `SELECT cron.unschedule('weekly-calendar-digest');`
- `DROP FUNCTION public.create_weekly_calendar_digest(date);`
- `DELETE FROM public.notifications WHERE type = 'weekly_digest' AND title = 'This week at school';` (clears the existing duplicates already in users' inboxes — including the read ones)

### 2. Rewrite synthetic digest loop in `NotificationsDrawer.tsx`

Replace the `for (let weekOffset = 0; weekOffset < 2; weekOffset++)` block (~lines 222–300) with a single pass anchored to **today (local Asia/Kuala_Lumpur)**:

```text
const isMonday = today.getDay() === 1;   // 1 = Monday
const weekStart = monday of this week;
const weekEnd   = sunday of this week;

if (isMonday):
    emit "Week at a glance — Mon … Sun" with all events Mon→Sun (if any)
    // no daily item today
else:
    emit "What's on — <today's weekday, date>" with today's events only (if any)
```

That is the entire generator. No backfill loop, no next-week prefetch, no past-day "Daily recap", no future-day items.

### 3. Drop the now-dead filter

`parseSyntheticAnchorDate` + the `anchor <= today` filter at lines 309–322 become unnecessary (we never emit future items). Keep the sort by id-anchor for stability, or just sort by `id` desc.

### 4. Backend fetch window can shrink

In `useNotifications.ts` the calendar query currently spans `weekStart … in14Days` (line 233–234). For the new logic we only need:
- **If Monday:** Mon → Sun (this week).
- **Otherwise:** today only.

To keep the change small and avoid extra refetches across the day, leave the fetch window as `weekStartIso … weekEnd (Sunday)` — the drawer just filters down. No backend code change required beyond removing the +14d look-ahead (optional cleanup).

## Files touched

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Unschedule cron, drop function, delete existing rows |
| `src/components/NotificationsDrawer.tsx` | Rewrite the `allSyntheticItems` generator; drop future-date filter |
| `src/hooks/useNotifications.ts` *(optional)* | Tighten calendar event fetch window to current week only |

## Out of scope

- The synthetic CCA-session and teacher-PIC items (separate from weekly/daily digest — unchanged).
- Real DB notifications (announcements, attendance-marked, etc.) — unchanged.
- Adding a separate "tomorrow preview" — your spec explicitly says today-only for daily.

## Open question

When you say "Monday only shows Week at a glance" — if a brand-new event is **added** mid-week (say Wednesday), do you want Wednesday's "What's on" to include it (yes, that's automatic from calendar query), or do you also want a one-off "New event added" alert? I'll assume **no extra alert**; the Wednesday daily digest will just include it.

Confirm and I'll implement.
