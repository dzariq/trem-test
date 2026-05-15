## Goal

Replace the buggy collapsible week-bucket UI with simple, text-based daily/weekly digest notifications. Tabs become **Unread / Read** instead of **All / Unread**.

## New behavior

### Tabs
- Replace `All (n)` + `Unread (n)` with **`Unread (n)`** + **`Read (n)`**.
- Default tab: **Unread**.
- "Mark all read" button stays (only visible when unread > 0).

### Notification types shown
Drop the collapsible "This week / Next week / Later" buckets entirely. The drawer now shows three kinds of items, each as a single, plain card (no expand/collapse, no per-event rows):

1. **Daily digest (every day, if events exist today)**
   - Title: `Today — Fri, 15 May`
   - Body: plain text list of today's events, one per line, e.g.:
     ```
     • OHM
     • (Pri) Teachers Day Celebration
     ```
   - Tap → marks read + opens `/calendar`.

2. **Weekly digest (only on Monday, if events exist this week)**
   - Title: `This week — 18 May to 24 May`
   - Body: events grouped by day in plain text, e.g.:
     ```
     Mon 18 May
       • (Pri) Teachers Day Celebration
       • (Sec) Teachers Day Celebration
     Tue 19 May
       • OHM
     Fri 22 May
       • PH 8 (Hari Raya Haji)
     ```
   - Tap → marks read + opens `/calendar`.

3. **Other notifications** (announcements, attendance, grades, etc. — anything without `event_date`)
   - Render as before with `SwipeableNotification`.

Per-event rows for `next week` / `later` are removed from the drawer — they live only inside the Monday weekly digest.

### Read / unread state
- Daily and weekly digests reuse the existing **synthetic-notification-persistence** pattern (localStorage `notif_synthetic_read` / `notif_synthetic_dismissed`), keyed by date (`today-YYYY-MM-DD`, `week-YYYY-MM-DD`).
- Tapping a digest sets it read; the Read tab then shows it.
- X button still dismisses (hides) the digest for that day/week.

### Filtering by tab
- **Unread tab**: synthetic digests where `readSynthetic[id] !== true`, plus DB notifications where `is_read === false`.
- **Read tab**: synthetic digests where `readSynthetic[id] === true`, plus DB notifications where `is_read === true`.
- Dismissed items never appear in either tab.

## Files

- `src/components/NotificationsDrawer.tsx`
  - Remove `expandedBuckets`, `toggleBucket`, `renderWeekBucket`, `formatDatePill`, `groupedSections`, `ChevronDown`, `ChevronRight` imports.
  - Replace tab Badges with Unread / Read; default `filter` state = `"unread"`.
  - Rewrite `syntheticItems` to build daily + weekly digests as multi-line plain text (`message` with `\n`).
  - Update `renderSynthetic` so the message preserves line breaks (`whitespace-pre-line`, no `line-clamp`).
  - Combined render: synthetic items + filtered DB notifications (both filtered by Read/Unread).
  - Tap on synthetic → mark read + close drawer + `navigate("/calendar")`.

No DB, hook, or other-file changes.

## Out of scope

- Server-side push for the Monday digest (unchanged).
- Calendar page itself.
- Changing event data sources or `useNotifications` hook.
