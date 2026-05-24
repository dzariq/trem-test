Change the parent `SecondaryNavBar` background gradient from the current dark brown to a gold gradient inspired by the Collinz logo gold.

## Change
In `src/components/layout/SecondaryNavBar.tsx`, replace the parent branch of the `backgroundImage` style:

- From: `linear-gradient(135deg, hsl(28 40% 28%) 0%, hsl(22 45% 18%) 100%)`
- To a warm gold gradient, e.g. `linear-gradient(135deg, hsl(43 75% 55%) 0%, hsl(36 80% 38%) 100%)` (bright logo gold → deeper antique gold).

Teacher gradient stays untouched (dark green).

## Notes
- Keep existing border + shadow; the Parent/Teacher pill on top already has white background so it stays readable on gold.
- May slightly darken the bottom stop if contrast with the pill border feels weak after preview.
- No other files affected.