## Goal

Move the **Campus Toggle** (GL/BO) and **Portal Switcher** (Parent/Teacher) out of the hero-banner overlay into a dedicated **secondary nav row** that sits directly below the main `AppHeader`. The row only renders when at least one of the two controls has something to show; otherwise it disappears entirely (no empty bar, no spacing).

## Behaviour

- **Visibility rule:** render only if `(campuses.length >= 2)` OR `(hasParentRole && hasTeacherRole)`. If neither is true → return `null` (no DOM, no height).
- **Layout:** sticky just under the header, full width, slightly tinted background (`bg-muted/40` with `backdrop-blur-sm` and a hairline `border-b border-border/60`) so it reads as a distinct band but stays subtle.
- **Content:** Campus toggle on the left, Portal switcher on the right, `px-4 py-2`, both aligned to the same row. If only one of them qualifies, that single control sits on the left and the right side stays empty.
- **Hero banner:** remove the two `absolute` overlay blocks (`CampusToggle` top-left, `PortalSwitcher` top-right). Keep the welcome quote and banner image untouched.

## New component

`src/components/layout/SecondaryNavBar.tsx`
- Reads `useCampus()` for `campuses` length and `useUserRoles()` for `hasParentRole` / `hasTeacherRole`.
- Computes `shouldRender = campuses.length >= 2 || (hasParentRole && hasTeacherRole)`. Returns `null` if false.
- Renders:
  ```
  <div className="sticky top-[var(--header-h,56px)] z-30 bg-muted/40 backdrop-blur-sm border-b border-border/60">
    <div className="flex items-center justify-between px-4 py-2">
      <CampusToggle size="sm" />     // self-hides if single-campus
      <PortalSwitcher size="sm" />   // self-hides if not dual-role
    </div>
  </div>
  ```
  (Both child components already early-return `null` when their condition isn't met, so the inner row collapses gracefully when only one applies.)

## Wiring

- **`src/pages/teacher/TeacherHomePage.tsx`**
  - Remove the two `absolute top-2 left-3` / `top-2 right-3` overlay divs inside the hero block.
  - Render `<SecondaryNavBar />` immediately after `<AppHeader />` (before the hero `<div>`).
- **`src/pages/HomePage.tsx`** (parent home)
  - Remove the `<div className="absolute top-2 right-3 z-20"><PortalSwitcher … /></div>` overlay on the hero.
  - Render `<SecondaryNavBar />` immediately after `<AppHeader />`.
- No changes to `CampusToggle`, `PortalSwitcher`, `AppHeader`, `useCampus`, or `useUserRoles` — they already expose the right state.

## Out of scope

- No changes to other teacher/parent pages right now (header on inner pages doesn't currently show these toggles). If you want the secondary nav on every screen later, we can lift it into `AppLayout` / `TeacherAppLayout` as a follow-up.
- No change to roles in the database — `junhan@collinz.edu.my` still has only the teacher role, so the Portal switcher will remain hidden for that account until a parent role is granted. (Flagged separately.)
- No change to the shared Supabase backend or the mobile-app project.

## Files touched

- `src/components/layout/SecondaryNavBar.tsx` (new)
- `src/pages/teacher/TeacherHomePage.tsx` (remove overlays, add bar)
- `src/pages/HomePage.tsx` (remove overlay, add bar)
