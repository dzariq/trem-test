## Goal
Swap the subtle gradient colors on the secondary nav strip: Parent → light gold, Teacher → light green. Make the active side of the Parent/Teacher pill reflect the same color (gold when Parent active, green when Teacher active), at a visible (not washed-out) intensity.

## Changes

**1. `src/components/layout/SecondaryNavBar.tsx`**
Swap the two `linear-gradient(...)` values:
- Parent (was green) → gold: `hsl(45 85% 58% / 0.18) → /0.06 → background`
- Teacher (was gold) → green (primary): `hsl(var(--primary) / 0.18) → /0.06 → background`

**2. `src/components/layout/PortalSwitcher.tsx`**
Replace the single `ACTIVE_STYLE` constant with a per-side active style so the highlighted pill matches its color:
- Parent active → gold tint: `bg-[hsl(45_85%_58%/0.22)] text-[hsl(38_78%_30%)] border-[hsl(38_78%_42%/0.55)]`
- Teacher active → green tint: `bg-primary/15 text-primary border-primary/50`

Inactive stays as today (muted, transparent).

**3. Child selector strips (subpages)**
Keep these green — the user only asked to swap the home secondary nav and pill, and previously confirmed green for student-dropdown strips. No change to `AppHeader.tsx` or `ParentCcaPage.tsx`.

## Out of scope
- No token changes in `index.css` / `tailwind.config.ts`.
- No logic, routing, or data changes.
