

## Problem

The `AnnouncementDrawer` uses `h-auto` for its content height (line 244), causing it to size based on content rather than respecting the 75% snap point. The standardized `BottomSheet` component uses `h-[100dvh]` which lets vaul's snap points control the visible portion.

## Fix

**File: `src/components/AnnouncementDrawer.tsx` (line 244)**

Change the non-fullscreen height from `h-auto` to `h-[100dvh]` to match the `BottomSheet` pattern:

```
// Before
snap === 1 ? "h-[calc(100dvh-var(--safe-top))] rounded-none pt-[var(--safe-top)]" : "h-auto max-h-[calc(100vh-var(--safe-top)-var(--safe-bottom))]"

// After  
snap === 1 ? "h-[calc(100dvh-var(--safe-top))] rounded-none pt-[var(--safe-top)]" : "h-[100dvh] max-h-[calc(100dvh-var(--safe-top))]"
```

This single change makes the drawer always render at full viewport height internally, while vaul's snap point system controls how much of it is visible — exactly how the Events bottom sheet works. The drawer will open at 75%, drag up to 95%, then to 100%.

