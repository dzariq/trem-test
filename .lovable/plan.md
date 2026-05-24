## Goal

Mirror the web project's "same email can be both parent and teacher" capability on mobile by exposing a quick portal switcher in the header area — styled like the existing `CampusToggle` segmented pill — so dual-role users can flip between the Parent and Teacher portals without going into Profile.

The underlying logic already exists: `useAuth().setPortal()` plus the manual "Switch to Parent / Teacher" buttons inside the two Profile pages. We just need a always-visible shortcut.

## Changes

### 1. New `src/components/layout/PortalSwitcher.tsx`
- Segmented two-pill toggle (`Parent` / `Teacher`), same visual language as `CampusToggle`.
- Reads `useAuth()` for current `portal` and `useUserRoles()` for `hasParentRole` / `hasTeacherRole`.
- Renders **nothing** unless the user has **both** roles (single-role users see no toggle — preserves the current strict guard behavior).
- On click of the inactive side:
  1. `setPortal("family" | "teacher")`
  2. `queryClient.clear()` (avoid leaking data between contexts)
  3. `navigate("/portal" | "/teacher", { replace: true })`
- Icons: `Users` for Parent, `GraduationCap` for Teacher (matches `RoleSelectionPage`).

### 2. `src/pages/teacher/TeacherHomePage.tsx`
- In the hero banner overlay, render `<PortalSwitcher />` next to the existing `<CampusToggle />`.
- Keep `CampusToggle` on the left; place `PortalSwitcher` on the right side of the hero (`absolute top-2 right-3 z-20`) so they sit on opposite corners and don't collide when both are visible.

### 3. `src/pages/HomePage.tsx` (parent home)
- Add the same `<PortalSwitcher />` overlaid on the parent hero banner (`absolute top-2 right-3 z-20`), so a dual-role user signed into the family portal has a symmetric way back to the teacher side. Parent home has no campus toggle today, so there's no collision.

### 4. No changes to
- `AuthContext`, `ParentStudentGuard`, `TeacherGuard`, routing, RLS, or edge functions. The web project already handled the data-layer re-link; mobile only needs the UX shortcut.
- Profile pages keep their existing "Switch to Parent / Teacher" rows as a secondary entry point.

## Technical notes

- Single-role users: component returns `null`, so nothing changes for them.
- Dual-role detection uses `useUserRoles()` which already powers both guards.
- `queryClient.clear()` is the same call used by the existing profile-page switchers, so cache hygiene stays consistent.
- Visual sizing matches `CampusToggle size="sm"` (`px-2 py-0.5 text-[11px]`) to keep the hero overlay compact.
