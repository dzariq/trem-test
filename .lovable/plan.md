## Goal

Reduce notification volume by collapsing each week bucket into **one** notification entry (not row-per-event), and add day-aware summaries.

## Behaviour

**Week buckets (This week / Next week / Later)**
- Render as a **single collapsed card** per bucket showing:
  - Bucket label + event count (e.g. "Next week — 2 events")
  - One-line preview: comma-joined event titles, truncated (e.g. "Teachers Day Cele…, Edu Field Trip…")
  - Date range (e.g. "Mon 18 – Fri 22")
  - Unread dot if any item is unread
- Tap → expands inline (accordion) to reveal the per-day rows we have today
- Swipe / X dismisses the entire bucket; "Mark all read" affects all items in bucket

**Monday weekly summary (auto)**
- On Mondays, prepend a synthetic "📅 This week at a glance" notification at the top of the inbox
- Lists all events Mon–Sun for the active campus, grouped by day
- One notification, persists read/dismiss state per user (reuse synthetic-notification-persistence pattern)
- Tap opens the same expanded week view

**Daily summary (auto, every day)**
- Synthetic "Today's schedule" notification if there are any events today
- Shows count + event titles for today
- Auto-dismisses at end of day; read state persisted

**Individual day events**
- Today's individual events still appear (so users see each one), but next-week / later events are **only** inside the collapsed week card — no per-event rows in the drawer

## Files

- `src/components/NotificationsDrawer.tsx`
  - Replace `renderWeekBucket` row list with collapsed summary card + expandable section
  - Add `buildWeeklySummary()` and `buildDailySummary()` synthetic notifications
  - Inject them into the `inbox` section based on `new Date().getDay()` and event presence
  - Reuse existing read/dismiss persistence hooks

No DB, hook, or other component changes.

## Out of scope

- Server-side push for Monday digest (already covered by previous migration's `weekly_digest` job — this is the in-app drawer view only)
- Changing event data sources
