## Goal

Remove the portal selection step before login. The user lands directly on a single login screen (email or phone OTP). The portal is auto-detected from their `user_roles` after authentication. Dual-role users land on Parent by default and use the existing `PortalSwitcher` pill to flip.

## Changes

### 1. Routing (`src/App.tsx`)
- Make `/` render `Login` directly (drop `RoleSelectionPage` as landing).
- Keep `/login` pointing to `Login` for back-compat (deep links, profile "switch" flows).
- Leave `RoleSelectionPage` file in place but unreferenced (or delete it — pick one; plan keeps the file to avoid churn).

### 2. Login page (`src/pages/Login.tsx`)
- Remove `portal` derivation from URL/stored preference and remove the "Please select a portal" guard.
- Remove the "redirect to `/` if no portal" effect.
- Remove `portalLabel` subtitle (replace with a neutral subtitle like "Sign in to continue").
- Stop sending `portal` in the `phone-login` invoke body. Backend will determine roles.
- Post-login redirect logic (new):
  - If `hasTeacherRole && !hasParentRole && !hasStudentRole` → `/teacher`
  - Else if `hasParentRole` → `/portal` and `setPortal("family")`
  - Else if `hasStudentRole` → `/students` and `setPortal("family")`
  - Else if dual (parent + teacher) → default to `/portal`, `setPortal("family")` (user can flip via `PortalSwitcher`)
  - Else fall back to legacy `profile.role` check.

### 3. Edge function (`supabase/functions/phone-login/index.ts`)
- Make `portal` optional. When omitted, accept ANY role (`parent`, `student`, `teacher`, `admin`, `super_admin`) as valid.
- When omitted, skip the "wrong portal" 403 branch — if a `user_profiles` row exists for the email/phone AND has any role in `user_roles`, mint the session.
- Keep current behavior when `portal` IS provided (back-compat for any caller still passing it).
- Student fallback path stays unchanged (only triggers on email lookup miss).

### 4. RoleSelectionPage (`src/pages/RoleSelectionPage.tsx`)
- No longer used as landing. Leave file untouched to keep the diff small; it becomes dead code reachable only by direct URL `/role` (which doesn't exist). Safe to delete in a follow-up.

## Out of scope
- `PortalSwitcher` already works for dual-role users post-login — no change.
- Auth guards (`ParentStudentGuard`, `TeacherGuard`) already accept roles from `user_roles` — no change.
- Profile pages' "Switch to Teacher/Parent" buttons keep working.

## Technical notes
- `setPortal("family")` is still called on successful login so the cache/UI know which side to render first; dual-role users can swap with the pill.
- No DB migration required.
- Edge function change is backward compatible — old clients still passing `portal` continue to work.
