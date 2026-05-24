## Changes

### 1. SecondaryNavBar visual
`src/components/layout/SecondaryNavBar.tsx`
- Replace `bg-muted/50` with a lighter neutral: `bg-muted/20` (light gray)
- Add a full border (`border border-border/60 rounded-none`) so the row reads as a contained bar, keep `border-b` for separation from content
- Keep sticky, padding, layout unchanged

### 2. Campus toggle logic (context-aware)
Same file. Today it shows whenever the user has ≥2 campuses, regardless of portal. New rule:

- Read current portal from `useAuth().portal` (fallback to route)
- Read `linkedStudents` from `useStudentSelection()`
- `parentCampusCount = new Set(linkedStudents.map(s => s.campus_code).filter(Boolean)).size`
- `showCampus` =
  - in **teacher portal**: `campuses.length >= 2` (unchanged)
  - in **parent portal**: `parentCampusCount >= 2`
- `showPortal` unchanged (`hasParentRole && hasTeacherRole`)

Result: Tang Junhan (3 kids all in GL) will not see the GL/BO toggle while in parent portal, but still sees it in teacher portal.

### 3. Fix "no kids detected" for dual-role accounts
`src/data/students.ts` → `listMyLinkedStudents()`

Today it branches on `profile.role`. For this user `profile.role === "teacher"` so the parent branch never runs even though `user_roles` has `parent`. Fix:

- After fetching profile, also query `user_roles` for the auth user
- If `roles` includes `parent` (or legacy `profile.role === 'parent'`), call `listViaStudentGuardians(authUserId)` and return those students
- Keep existing student-role branch
- This makes the parent portal find the 3 linked children for `junhan@collinz.edu.my`

### Out of scope
- No DB changes, no auth/role changes
- No edits to `CampusToggle`, `PortalSwitcher`, `AuthContext`, guards
- Teacher portal behavior unchanged

### Technical notes
- `useStudentSelection` is already mounted globally (StudentSelectionProvider wraps the app), safe to consume in `SecondaryNavBar`
- `linkedStudents` is empty while loading — the toggle simply stays hidden until students load, which is the desired UX (no flicker of an inapplicable control)
