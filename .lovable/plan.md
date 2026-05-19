## Goal

1. Confirm Clubs, Outdoor CCAs, and Events all render with the same enrolled-style card (the "Art Club" layout).
2. Remove the gradient fade on the hero image so the photo shows as-is.

## Findings

- `src/components/cca/CcaActivityCard.tsx` is the single card used for every CCA kind. It's already used by:
  - `CalendarPage.tsx` → Enrolled list (line 587) and Available list (line 668)
  - `ProfilePage.tsx` → Student profile CCA list (line 937)
- The filter tabs only switch the data list; they don't swap card components. So all kinds (clubs / outdoor / events) already share the same layout — no extra wiring needed.
- The "fade" the user is seeing comes from two overlays stacked on top of the image inside `CcaActivityCard.tsx`:
  - Lines 85–89: three decorative translucent circles
  - Line 92: `bg-gradient-to-b from-transparent via-transparent to-card` — this is the bottom fade that visibly bleeds the image into the card background.

## Changes

`src/components/cca/CcaActivityCard.tsx`:
- Remove the bottom gradient overlay (`<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />`).
- Remove the decorative gradient circles block (the `opacity-20` absolute layer with the three circles), since the user asked for "the image as it is".
- Keep the badges (Enrolled pill + kind pill) overlaid at the top with their existing shadow so they remain readable against any photo.
- Keep everything else (height, rounded corners, content section) unchanged.

## Verification

- Reload the Calendar → CCA tab and confirm:
  - Art Club (with image) shows a clean photo with no bottom fade and no decorative circles.
  - A Club without its own image still falls back to the venue image / category icon (existing logic in `CcaActivityImage`).
  - Outdoor and Events cards visually match Clubs (same card, just different badge/icon).
- Visit Profile → student → CCA list and confirm the same card looks identical.
- No TypeScript or console errors.

## Out of scope

- No data, hook, or routing changes.
- No edits to detail sheets or session sheets.
