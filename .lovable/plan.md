# CCA pill — 3 types with icons + colors

## Scope
Use the same 3 styles everywhere CCA appears: month grid, week/day time grid, and the "What's Coming Up → CCA" list.

## Type mapping (from `cca_activity_types`)
Backend currently has 5 type names. Group them into 3 visual buckets:

| Bucket | Icon | Color (light/border/text) | Source type names |
|---|---|---|---|
| **Clubs** | `Users` | yellow — `bg-yellow-50 border-yellow-400 text-yellow-800` | `Indoor CCA`, `Indoor Talks/Workshop`, `Sports` |
| **Outdoor** | `Bike` | orange — `bg-orange-50 border-orange-400 text-orange-800` | `Outdoor CCA` |
| **Events** | `PartyPopper` | cream/amber — `bg-amber-50 border-amber-300 text-amber-700` | `Event` |

Dark-mode equivalents follow the existing `dark:bg-*/30 dark:text-*-200 dark:border-*-500/60` pattern.

If `Sports` should be Outdoor instead of Clubs, that's a one-line swap — flag during review.

## Technical changes

1. **`src/components/cca/CcaTypeTabs.tsx`**
   - Add `getCcaBucket(typeName)` → `"clubs" | "outdoor" | "events"` (single source of truth).
   - Add `getCcaBucketIcon(bucket)` → returns `Users | Bike | PartyPopper` lucide component.
   - Rewrite `getCcaTypePillColor` to delegate via the bucket → only 3 color sets returned.
   - Keep `getCcaTypeColor` / `getCcaTypeBadgeColor` untouched (used by activity cards / details sheet that still display the raw type name).

2. **`src/components/calendar/MonthGridCalendar.tsx`**
   - Replace hard-coded `Users` icon with `getCcaBucketIcon(bucket)` resolved from `session.category`.
   - Color from `getCcaTypePillColor` (now bucket-driven).

3. **`src/components/calendar/TimeGridCalendar.tsx`**
   - Same swap: dynamic icon by bucket, both for all-day strip and timed blocks.

4. **`src/components/calendar/UpcomingEventsSection.tsx`** (CCA tab)
   - Replace solid `primary` date-box + `bg-primary/10` row with bucket-tinted styling so each session's row + date-box + small `CCA` chip match the screenshot tones.
   - Add the bucket icon next to the title (matches month-grid pills).

## Out of scope
- Tab order, "Events" rename, filter sheet behavior, and CCA details sheet styling are unchanged.
- No DB / RLS changes — purely presentation.
