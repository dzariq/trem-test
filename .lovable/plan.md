## Problem

The Notifications drawer's last items (the bottom attendance cards) are clipped by the page's bottom navigation bar + iOS home-indicator safe area, and the user can't scroll past them.

## Cause

In `src/components/NotificationsDrawer.tsx`, the scrollable list container ends with only `pb-6` (24px). The drawer sits above the page's fixed bottom navigation (~64px tall) plus the safe-area inset, so the final card lands behind the nav and is unreachable.

## Fix

One-line spacing change in `src/components/NotificationsDrawer.tsx`:

Replace the list container's padding:

```tsx
<div className="space-y-2 pb-6 overflow-x-hidden">
```

with:

```tsx
<div className="space-y-2 overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
```

This gives ~96px + safe-area of bottom scroll runway so the last notification clears the bottom navigation at every snap point.

## Out of scope

- No changes to `BottomSheet`, snap points, sort order, or notification logic.
- No backend or RLS changes.
