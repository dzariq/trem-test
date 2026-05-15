## Lump date-based notifications into one container per week

### Today
Each calendar event is its own swipeable card under the "This week / Next week / Later" headers, which makes the list very long.

### Change
Render each week-bucket (This week, Next week, Later) as **one container card** that lists all its events as compact rows inside, instead of N separate cards. Non-event items (Latest / announcements / attendance / weekly digest) keep their existing one-card-per-item layout — only date-based event notifications get lumped.

### UX inside the lumped container
- Section header chip on the card (e.g. "This week — 3 events").
- Each row inside: small date pill (e.g. "Sun 17"), event title (truncated), unread dot. Tapping a row marks it read and navigates to the calendar; whole card is not a single link.
- Swipe-to-dismiss applies to one row (not the whole bucket) — implemented as a lightweight inline row, not the existing `SwipeableNotification`.
- "Mark all in this week as read" small action in the card header.

### Implementation
- Edit `src/components/NotificationsDrawer.tsx` only.
- Replace the per-section `section.items.map(renderItem)` for buckets `this`, `next`, `later` with a new local `WeekBucketCard` component (defined in the same file) that renders the rows.
- Keep `Latest` bucket and the unread-filter view unchanged (still individual `SwipeableNotification`s).
- No data, hook, or DB changes.
