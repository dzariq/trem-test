## Goal

Make "CCA Session Created" notifications more student/parent-friendly and visually distinguishable by CCA kind (Club / Outdoor / Event / Sport), in:
- The DB-trigger notification fired when a new CCA session is created
- The T-3 / on-the-day reminder synthetic notifications (parent + teacher)
- The native local-push reminders

## New wording

Created (DB trigger):
- Title: `{Activity Name}` (e.g. `Board Games`) — activity name front-and-centre instead of "CCA Session Created"
- Message: `New {Kind} session · Fri, 31 Jul · 3:30 PM–4:30 PM` (parent) / `New {Kind} session you're leading · Fri, 31 Jul · 3:30 PM–4:30 PM` (teacher)

T-3 reminder:
- Title: `{Activity Name} is in 3 days`
- Message: `{Kind} · Fri, 31 Jul at 3:30 PM`

On the day (T-0):
- Title: `{Activity Name} is today`
- Message: `{Kind} · 3:30 PM at {location?}` (location only if present in DB synthetic path; native push keeps just the time)

"Kind" label uses Title Case: `Club`, `Outdoor`, `Event`, `Sport`.

## Icon + colour per kind

Introduce four new notification `type` values so the bell list can render distinct icons + colours:

| type           | icon (lucide) | colour class                           |
|----------------|---------------|----------------------------------------|
| `cca_club`     | `Palette`     | `bg-emerald-500 text-white` (current)  |
| `cca_outdoor`  | `Tent`        | `bg-amber-600 text-white`              |
| `cca_event`    | `PartyPopper` | `bg-fuchsia-500 text-white`            |
| `cca_sport`    | `Trophy`      | `bg-orange-500 text-white`             |

Legacy `type === "cca"` rows keep current Palette/emerald rendering (back-compat).

Kind resolution:
- DB trigger / synthetic hooks read `cca_activities.kind` (`club` | `outdoor` | `event`).
- "Sport" is detected when `kind = 'club'` AND activity name/category matches `/sport|football|basketball|swim|rugby|cricket|netball|athletic|tennis|badminton|volleyball/i` — only used for icon/colour selection and the `Sport` label.

## Files to change

Database
- `supabase/migrations/{new}.sql` — replace `public.notify_cca_session_created()` so it:
  - Joins `cca_activities` to read `kind` (and name for sport detection)
  - Maps kind → `cca_club` / `cca_outdoor` / `cca_event` / `cca_sport` and a friendly kind label
  - Writes the new title/message shape above for both teacher and parent inserts
  - Preserves existing `dedupe_key`s so re-running the trigger updates the same rows

Frontend
- `src/hooks/useNotifications.ts` — for both the parent (`cca_session_enrollments`) and teacher (`cca_session_pics`) T-3/T-0 blocks:
  - Also `select` `activity:cca_activities(name, kind, category)`
  - Compute `cca_*` type + kind label
  - Emit the new title/message shape; keep existing `source_key` so dismissals/read-state survive
- `src/components/NotificationsDrawer.tsx` — extend `getTypeIcon` and `getTypeColor` with the four new `cca_*` types (keep `cca` fallback)
- `src/pages/NotificationsPage.tsx` and `src/pages/teacher/TeacherNotificationsPage.tsx` — mirror the same icon/colour mapping if they maintain their own (will be verified before editing)

Native push
- `src/lib/native/ccaLocalNotifications.ts` — accept optional `kind` on `CcaReminderInput`; produce the matching title (`{name} is in 3 days` / `{name} is today`) and body (`{Kind} session at {time}`)
- `src/hooks/useCcaPushReminders.ts` — pull `kind` from the `cca_activities` join and pass it into `scheduleCcaReminders`

## Out of scope

- No new DB columns, RLS, or edge-function changes.
- No new "kind" entity beyond mapping `club + sporty name → sport` for visuals.
- No change to dismissal / read-state behaviour or to the 3-day + on-the-day cadence.

## Verification

- After the migration deploys, insert a test row into `cca_sessions` for each kind (club / outdoor / event, plus a sport-named club) and confirm rows appear in `notifications` with the new `type`, title, and message.
- In preview, open the bell on `/teacher/cca` and `/parent/calendar` and confirm each kind shows the correct icon + colour and the rephrased copy.
