
# Fix Notification Read/Unread/Dismiss Bugs

## Root Cause Analysis

**Bug 1: "Mark all read" doesn't work**
In `useNotifications.ts` line 433, the optimistic update's `getQueryData` uses a 3-element key `["notifications", user?.id, userRole]` but the actual `queryKey` is 4 elements `["notifications", user?.id, userRole, studentIds]`. The previous state snapshot is never found, so rollback silently fails. More importantly, the `setQueryData` on line 435 correctly uses `queryKey`, so "mark all read" does visually update -- but `onSettled` immediately fires `invalidateQueries` which refetches from the server. Since the upsert may not have completed yet (race condition), the refetch brings back the old unread state.

**Bug 2: Swipe delete doesn't persist**
The `deleteNotificationMutation` (line 452) only upserts into `notification_reads` (marks as read). It removes the item from local state optimistically, but `onSettled` refetches from the server where the notification still exists and is not filtered out. It reappears immediately.

**Bug 3: No dismissal tracking**
There is no `notification_dismissals` table. Swipe-to-delete has no persistent storage, so dismissed notifications always return on refresh.

---

## Implementation Plan

### Step 1: Create `notification_dismissals` table (SQL migration)

```sql
CREATE TABLE public.notification_dismissals (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE public.notification_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON public.notification_dismissals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own dismissals"
  ON public.notification_dismissals FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_dismissals;
```

### Step 2: Update fetch query in `useNotifications.ts`

Change the notifications fetch to also left-join `notification_dismissals` and filter out dismissed ones:

```
.select(`*, notification_reads!left(read_at), notification_dismissals!left(dismissed_at)`)
.eq("notification_reads.user_id", user.id)
.eq("notification_dismissals.user_id", user.id)
```

Then when processing results, skip any notification where `notification_dismissals` has a row (i.e., `dismissed_at` is set).

### Step 3: Fix swipe-delete to upsert into `notification_dismissals`

Replace the current `deleteNotificationMutation.mutationFn` to upsert into `notification_dismissals` instead of `notification_reads`. Keep the optimistic removal from local state.

### Step 4: Fix "Mark all read" optimistic update

- Fix the `getQueryData` key on line 433 to use the correct 4-element `queryKey`
- Keep `onSettled` invalidation but it will now work correctly since the upsert completes before or during refetch

### Step 5: Subscribe to `notification_dismissals` in realtime

Add a realtime listener for `notification_dismissals` filtered by `user_id`, so cross-device dismissals sync.

### Step 6: Update Supabase types

Regenerate/update `src/integrations/supabase/types.ts` to include the new `notification_dismissals` table.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/...` | New migration: create `notification_dismissals` table + RLS + realtime |
| `src/hooks/useNotifications.ts` | Fix fetch query, fix mark-all-read key bug, fix delete to use dismissals table, add realtime for dismissals |
| `src/integrations/supabase/types.ts` | Add `notification_dismissals` type definitions |

## Acceptance Criteria

- Swipe delete removes notification permanently (persists after refresh)
- "Mark all read" clears all unread badges instantly and persistently
- Tap notification marks it as read instantly
- Badge count stays consistent across all actions
- Works for both Teacher and Parent accounts
