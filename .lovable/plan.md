## Notifications audit + plan

### Audit of what already exists

| Requirement | Status | Where |
|---|---|---|
| Newly added calendar entry → individual notification | Already works | DB trigger `notify_on_calendar_event` on `public.calendar_events` (INSERT/UPDATE) writes a row into `public.notifications` with `source_key = event:<id>`. Realtime subscription in `useNotifications` picks it up live. |
| Attendance marked → parent notification | Already works | DB trigger `notify_parent_on_attendance` on `public.attendance` writes a notification for non-present statuses (absent/late/excused) to each linked parent. Realtime subscription delivers it instantly. |
| Weekly Monday-morning digest of the week's calendar events | Missing | No cron job or aggregator currently. |
| Weekly grouping in the Notifications drawer UI | Partial | Today the drawer is a flat list; events appear individually. No "This week / Next week" grouping. |

### What to build

1. Backend — Monday morning weekly digest
   - New SQL function `public.create_weekly_calendar_digest()` that, for the current week (Mon–Sun in school timezone), looks up all visible `calendar_events` per audience (`parent`, `teacher`) per `campus_code`, and inserts ONE summary notification per (user, campus) with:
     - `type = 'weekly_digest'`
     - `title = "This week at school"`
     - `message = "<n> events this week: …"` listing up to 5 titles + dates
     - `source_key = "weekly-digest:<iso-week>:<campus_code|all>:<user_id>"` (idempotent — re-running same week is a no-op)
     - `link_to = "/parent/calendar"` or `"/teacher/calendar"`
   - Schedule with `pg_cron`: every Monday at 07:00 server time. (Falls back to manual edge-function trigger if pg_cron not enabled — we'll attempt cron first.)
   - Make sure the new notifications row stays compatible with existing `notification_reads` / `notification_dismissals`.

2. Frontend — group "Upcoming events" by week in the drawer
   - In `src/components/NotificationsDrawer.tsx`, when `filter === "all"`, split notifications into three buckets:
     1. New & alerts (announcements, attendance, weekly_digest, grades, etc. — anything without an `event_date` OR created in the last 24h)
     2. This week (event_date within current ISO week)
     3. Next week (event_date within following ISO week)
     4. Later (everything else with an event_date)
   - Render each bucket under a small subtle header (e.g. "This week", "Next week", "Later") only when non-empty. Unread filter view stays flat.
   - Add a `Megaphone`/`CalendarRange` icon + emerald style for the new `weekly_digest` type in the `getTypeIcon` / `getTypeColor` maps.

3. No change needed for per-event and attendance flows — confirm by reading the existing triggers and add a short comment in `useNotifications.ts` documenting the three notification sources (DB trigger events, attendance, weekly digest) so this contract is obvious to future devs.

### Order of operations

1. Write migration: weekly digest SQL function + pg_cron schedule + (optionally) backfill this week on deploy.
2. Update `NotificationsDrawer.tsx` to group by week and add `weekly_digest` styling.
3. Update memory index with a short "Weekly Calendar Digest" entry.

### Open question

Do you want the weekly digest sent to **teachers as well as parents**, or **parents only**? (Default in the plan: both audiences, scoped by their campus.)
