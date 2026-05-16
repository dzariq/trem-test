## What already exists

The notification system currently fires from a few places. Here's the audit:

| Source | Trigger | Status |
|---|---|---|
| **Calendar events** | Client-side synthetic daily / weekly "What's on today" + "Week at a glance" digests | Working (you're happy with this) |
| **Weekly digest** | DB cron `weekly-calendar-digest` runs every Sunday 23:00, inserts one "This week at school" row per user | Working |
| **Attendance** | DB trigger `trg_notify_parent_on_attendance` on `public.attendance` — fires on INSERT/UPDATE when status is `absent` / `late` / `excused` (skips `present`). Inserts one notification per linked guardian, deduped per student+date+guardian, links to `/parent/attendance` | Working |
| **CCA sessions** | Client-side synthetic items for upcoming enrolled sessions (parent) and PIC sessions (teacher) | Working |
| **Announcements** | ❌ Nothing. Publishing a new announcement does not push a notification | **Missing** |

So the two things you mentioned:
- **Attendance marked** → already pushes a notification to parents (only for non-present statuses). No work needed unless you want to change the behavior.
- **New announcement** → not wired up yet. This is the gap to close.

## Plan: announcement → notification trigger

### 1. Database trigger on `public.announcements`

Create `notify_users_on_new_announcement()` — `SECURITY DEFINER`, `SET search_path = public` — that fires `AFTER INSERT` (and optionally `AFTER UPDATE OF is_published` so a draft → published transition also notifies).

Logic:
- Skip if the announcement is not published / not active (whatever the existing "live" flag is — I'll confirm against the `announcements` schema before writing the migration).
- Resolve audience:
  - If `target_audience = 'parent'` (or equivalent) → insert one notification per active parent in scope.
  - If `target_audience = 'teacher'` → one per active teacher.
  - If `target_audience = 'all'` → both.
- Respect `campus_code` on the announcement: notify users in that campus, or everyone when `campus_code IS NULL`.
- One row per recipient in `public.notifications` with:
  - `type = 'announcement'`
  - `title = '📢 ' || announcement.title` (or just the title — easy to tweak)
  - `message = ` short excerpt from the body
  - `link_to = '/parent/announcements/:id'` for parents, `/teacher/announcements/:id` for teachers (or the detail page route — I'll match the existing route)
  - `source_key = 'announcement:' || NEW.id || ':' || user_id` so re-runs upsert cleanly
  - `target_audience` matching the recipient's role
  - `is_read = false`

### 2. Client side

No code changes required — `useNotifications` already:
- queries `public.notifications` filtered by audience + user
- subscribes to realtime INSERTs on the table
- polls every 60s and refetches on app foreground

So new announcements will appear in the bell drawer automatically, with the existing 📢 Megaphone icon + primary color treatment.

### 3. Optional polish (ask before building)

- **Featured / pinned only**: only push notifications for `is_featured` or `is_pinned` announcements, to avoid spamming the bell every time a small notice is posted.
- **Aggregate digest**: instead of one notification per announcement, roll multiple same-day announcements into a single "3 new announcements today" entry. Cleaner but more work.
- **Attendance tweaks**: right now `late` and `excused` also notify. Some schools only want absent → notification. Easy to change.

## Technical details

- Migration file: new timestamped SQL under `supabase/migrations/` with the trigger function + `CREATE TRIGGER trg_notify_users_on_new_announcement AFTER INSERT OR UPDATE OF is_published ON public.announcements`.
- Function must be `SECURITY DEFINER` with `SET search_path = public` (matches the project's hardening rule).
- Loop over recipients via `FOR r IN SELECT ... FROM user_profiles ...` filtered by `role`, `is_active = true`, and campus.
- Use `ON CONFLICT (source_key) DO UPDATE` to keep idempotent.
- After approving the migration, the Supabase types file will be regenerated automatically; no client code edits are needed.

## Open questions before I write the migration

1. For new announcements, do you want notifications for **every published announcement**, or only **featured / pinned** ones?
2. Should the notification link open the **announcement detail page**, or just the announcements list?
3. Keep the current attendance behavior (notify for absent + late + excused), or restrict to **absent only**?
