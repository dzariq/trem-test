## Goal
Stop the BO/GL campus toggle from overlapping the username on the teacher home header.

## Changes (1 file)

**`src/pages/teacher/TeacherHomePage.tsx`** — `leftContent` of `AppHeader`:

1. Drop the small "Welcome back," label entirely.
2. Keep only the username line, made slightly larger for hierarchy.
3. Wrap the text block so it can shrink and truncate:
   - Container: `flex items-center gap-3 min-w-0 flex-1`
   - Text wrapper: `min-w-0 flex-1`
   - Username `<p>`: `text-sm font-semibold text-foreground truncate`
4. Keep the school badge as-is on the left.

## Result
- Single-campus teachers: badge + full username + bell + profile.
- Multi-campus teachers: badge + username (truncates with `…` if long) + BO/GL toggle + bell + profile — no overlap.
- No changes to `AppHeader.tsx` or `CampusToggle.tsx`; behavior on parent routes is unaffected.
