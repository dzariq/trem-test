## Goal

Make the Notifications drawer surface the latest real events (e.g. "Attendance marked") at the very top, give every card a clear tap-to-open / tap-X-to-dismiss affordance, and add a small colored status pill to attendance notifications so parents can see Present / Absent / Late / Excused at a glance.

## Issues observed (from the screenshot on /parent)

1. Calendar "What's on — Mon/Tue/Wed" cards appear above the much newer "Attendance marked" cards. Cause: in `useNotifications.ts` the sort prioritises any item that has an `event_date` (calendar items) over DB-stored notifications.
2. Real DB notification cards (attendance, announcements, etc.) only support tap-to-open + left-swipe-to-delete. The synthetic event cards have a visible X button. Behaviour should be consistent — every card needs a tap-to-open and a visible X to dismiss.
3. Attendance notifications read "KARTI SAI A/L THANABALAN is Excuse…", "…is Absent…", "…is Late…" — the status is buried in the truncated message text. There's no visual tag.

## Changes (frontend only, no DB work)

### 1. Sort order — `src/hooks/useNotifications.ts`
Replace the current sort block so real DB notifications (no `event_date`, includes attendance + announcements + alerts) come first, ordered by `created_at` desc (newest on top). Calendar/CCA synthetic items (with `event_date`) follow, ordered by `event_date` asc.

```text
[ DB notifications, newest first ]
[ Calendar / CCA items, soonest first ]
```

### 2. Dismiss X on every card — `src/components/SwipeableNotification.tsx`
Add a small `X` button (top-right of the card, same style as the synthetic-digest X) that calls `onDelete()` with `stopPropagation`. Keep the existing left-swipe-to-delete as a secondary gesture. Keep tap-to-open behaviour. Update the drawer copy "Tap to open • Tap × to dismiss" so it now applies to all cards.

### 3. Status tag on attendance notifications — `src/components/NotificationsDrawer.tsx`
In `renderItem`, when `notification.type === "attendance"`, parse the status from `notification.message` (regex match on `\b(present|absent|late|excused)\b`, case-insensitive) and pass an optional `statusTag` prop to `SwipeableNotification`. Render the pill next to the title with these colors (light bg + dark text + matching border, all via Tailwind utility classes consistent with existing `catPalette` in the file):

- Present  → emerald
- Late     → amber
- Absent   → rose
- Excused  → sky

`SwipeableNotification` gets one new optional prop `statusTag?: { label: string; className: string }` rendered inline after the title, before the unread dot.

### 4. Cleaner attendance message
Trim the status word from the displayed message (since it now lives in the pill) so the card reads e.g. "KARTI SAI A/L THANABALAN — 16 May 2026" instead of "…is Excused on …". Purely a display-side transformation in `renderItem`; the DB row is untouched.

## Out of scope

- No DB schema, trigger, or RLS changes (the attendance trigger already fires for all four statuses from the previous migration).
- No changes to the synthetic event/CCA digest cards beyond keeping them visually consistent with the new X button styling already present there.
- No new notification types.

## Files touched

- `src/hooks/useNotifications.ts` — sort block only
- `src/components/SwipeableNotification.tsx` — add X button + optional `statusTag` prop
- `src/components/NotificationsDrawer.tsx` — derive status tag, trim message, pass new prop
