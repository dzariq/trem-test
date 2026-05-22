## Goal

For every CCA session a user is involved in (teachers as PIC/co-PIC/bus/sport PIC; parents for enrolled children), surface a reminder **3 days before** the session and again **on the day**. Reminders appear in the in-app Notifications bell AND fire as a native local push on mobile.

## Scope

- Audience: teachers + parents (per their CCAs).
- Triggers per session: `T-3` and `T-0` (morning of, default 07:00 device-local).
- No backend cron / no FCM/APNs setup. Push is handled by Capacitor **Local Notifications** scheduled on the device when the app opens / refocuses. This keeps it inside the existing "shared Supabase backend" contract — no schema changes needed.

## In-app bell changes (`src/hooks/useNotifications.ts`)

Today the hook already pulls upcoming CCA sessions for parents (`cca_session_enrollments`) and teachers (`cca_session_pics`) within a ~14-day window and emits synthetic notifications. We tighten the emit rule:

- For each upcoming session, compute `daysOut = sessionDate − today` in local time.
- Only emit a synthetic notification when `daysOut === 3` OR `daysOut === 0`.
- Use two distinct `source_key`s per session so each trigger is independently read/dismissed:
  - `cca-session:{id}:t-3` and `cca-session:{id}:t-0` (parents)
  - `teacher-cca:{id}:t-3` and `teacher-cca:{id}:t-0` (teachers)
- Title prefix reflects the trigger so it's scannable:
  - `T-3` → `⏰ In 3 days · {Activity name}`
  - `T-0` → `🔔 Today · {Activity name}`
- Message keeps date + start time as today.

Existing dismissal/read storage (`synthetic-notification-state` in localStorage) works as-is — the new source_keys just slot in.

## Native push (Capacitor Local Notifications)

New small module + hook:

- Install `@capacitor/local-notifications` and register the plugin (`npx cap sync` reminder for the user after deploy).
- `src/lib/native/ccaLocalNotifications.ts`
  - `scheduleCcaReminders(sessions: Array<{ id, title, sessionDate, startTime }>)`:
    - For each session, schedule two local notifications:
      - At `sessionDate − 3 days` at 07:00 local
      - At `sessionDate` at 07:00 local
    - Notification id is a deterministic 31-bit hash of `${role}:${sessionId}:${trigger}` so re-scheduling is idempotent.
    - Skip scheduling if the trigger time is already in the past.
    - Persist scheduled ids in localStorage (`cca-local-notif-ids`) so we can cancel stale ones when the session list shrinks.
  - `cancelStaleCcaReminders(currentIds)` removes notifications for sessions no longer in the active list.
  - All calls are no-ops on web (`Capacitor.isNativePlatform()` guard).
- `src/hooks/useCcaPushReminders.ts`
  - Runs in `AppLayout` / `TeacherAppLayout` (already mounted for logged-in users).
  - Fetches the same teacher/parent CCA session lists already used by `useNotifications` (within the next 30 days) and calls `scheduleCcaReminders` + `cancelStaleCcaReminders`.
  - Re-runs on auth change, on app resume (Capacitor `App` `resume` event), and on a 6-hour interval.
- Permission: request `LocalNotifications.requestPermissions()` once on first native run; gracefully ignore denial.

## Files to touch

- `src/hooks/useNotifications.ts` — gate CCA synthetic emits to `daysOut ∈ {0, 3}`, new source_key + title format (parent + teacher branches).
- `src/lib/native/ccaLocalNotifications.ts` — new helper (schedule/cancel + hash + localStorage).
- `src/hooks/useCcaPushReminders.ts` — new hook (fetch + schedule, resume listener).
- `src/components/layout/AppLayout.tsx` and `src/components/layout/TeacherAppLayout.tsx` — mount the hook.
- `package.json` — add `@capacitor/local-notifications`.

## Out of scope

- Server-driven push (FCM/APNs, edge-function senders, `pg_cron`) — not needed for the requested 3-day/day-of reminders.
- New database tables, RLS changes, or edge-function changes.
- Changing the existing 14-day "upcoming events" listing in the bell; we only narrow the auto-emitted reminder set.
- iOS/Android native build wiring — user runs `npx cap sync` themselves per existing project flow.

## Notes / risks

- Local notifications fire only if the device has granted permission and the app has been opened at least once since the session was created. Acceptable for this product per the chosen "In-app + push (native mobile)" delivery option.
- 07:00 local fire time is a sensible default; we can expose a setting later if needed.
- The shared Supabase backend is untouched, so the sibling mobile-app project is unaffected.
