## Issues found

**1. Teacher layout is too wide on mobile/APK**
- `src/components/layout/AppLayout.tsx` (parent) wraps content in `max-w-lg mx-auto` (≈512px column, mobile-feel).
- `src/components/layout/TeacherAppLayout.tsx` uses only `w-full` with no max width, so on tablet/larger phones (and in some APK WebView contexts) the teacher pages stretch full width and look like a desktop view.

**2. Portal (Parent/Teacher) switcher is invisible in APK**
- `PortalSwitcher` is only rendered inside `SecondaryNavBar`.
- `SecondaryNavBar` is mounted on only two pages: `HomePage.tsx` and `teacher/TeacherHomePage.tsx`.
- Consequence: as soon as the user navigates to any other module (Attendance, CCA, Calendar, Profile, etc.) the switcher disappears. In the APK build the user often lands or stays on those inner pages, so they never see it.
- The switcher itself correctly gates on `hasParentRole && hasTeacherRole`, so the dual-role logic is fine — it's purely a placement problem.

## Plan

### Fix 1 — Match teacher width to parent
In `src/components/layout/TeacherAppLayout.tsx`, change the inner wrapper from `mx-auto w-full overflow-x-hidden` to `max-w-lg mx-auto` (same as parent `AppLayout`). This gives the teacher portal the same mobile-app feel and prevents the wide stretched look on the APK / larger viewports.

### Fix 2 — Show portal switcher on every page for dual-role users
Mount the `SecondaryNavBar` globally so it appears below `AppHeader` on every authenticated route, not just the two home pages.

Approach: render `SecondaryNavBar` once inside both `AppLayout` and `TeacherAppLayout` (directly above `{children}`), and remove the page-level `<SecondaryNavBar />` from `HomePage.tsx` and `TeacherHomePage.tsx` to avoid duplication.

Because `SecondaryNavBar` already returns `null` when neither the campus toggle nor the portal switcher needs to show, single-role users see no change. Dual-role users get the Parent/Teacher pill on every screen, including in the APK.

No business-logic changes — purely layout/presentation.

### Files to change
- `src/components/layout/TeacherAppLayout.tsx` — add `max-w-lg` wrapper; mount `SecondaryNavBar`.
- `src/components/layout/AppLayout.tsx` — mount `SecondaryNavBar`.
- `src/pages/HomePage.tsx` — remove the now-duplicate `<SecondaryNavBar />`.
- `src/pages/teacher/TeacherHomePage.tsx` — remove the now-duplicate `<SecondaryNavBar />`.

### Verification
- Visually check teacher pages at mobile width — content should be centered in a ≤512px column matching parent.
- On a dual-role account, navigate across modules (Home, Attendance, CCA, Calendar, Profile) in both portals and confirm the Parent/Teacher pill is visible on every screen.
- On a single-role account, confirm no extra bar appears (SecondaryNavBar returns null).
