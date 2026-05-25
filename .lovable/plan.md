Restrict the SecondaryNavBar (campus toggle + portal switcher bar) to only render on home page routes.

### Change
In `src/components/layout/SecondaryNavBar.tsx`, add a route guard at the top:
- Only render when `location.pathname` is exactly `/portal`, `/parent`, `/students`, or `/teacher`.
- On all other routes, return `null` so the bar is hidden.

This is a one-line logic addition before the existing `showCampus` / `showPortal` checks. No other files need changes — the component is already rendered inside `AppHeader` which is used across all pages.