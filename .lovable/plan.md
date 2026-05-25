## Grant `school_leader` Teacher-Portal Access (Mobile App)

Treat `school_leader` the same as teacher/admin/super_admin everywhere on the mobile app — routing, role hooks, and CCA "principal-tier" permissions. The DB enum already includes `school_leader` (types regenerated), so this is a frontend-only change.

### Files to update

1. **`src/hooks/useUserRoles.ts`**
   - Extend `AppRole` type: `"parent" | "teacher" | "admin" | "super_admin" | "school_leader"`.
   - Add `"school_leader"` to the `TEACHER_SIDE` array so `hasTeacherRole` returns true for school leaders.

2. **`src/pages/Login.tsx`**
   - In the post-login redirect effect, add `"school_leader"` to the `["teacher","admin","super_admin"]` profile-role fallback check so a school_leader-only user routes to `/teacher`.

3. **`src/pages/RoleSelectionPage.tsx`**
   - Same addition to the `["teacher","admin","super_admin"]` array.

4. **CCA permission hooks — replace `role === "principal"` with `role === "school_leader"`** (keeping the variable name `isPrincipal` for now to minimize churn; it just means "top-tier school manager"):
   - `src/hooks/useCcaActivityPermissions.ts`
   - `src/hooks/useCcaActivityFilter.ts`
   - (`useCcaBusPermissions.ts` already derives from `useCcaActivityPermissions`, so it inherits the fix.)

### Out of scope (will not change)

- RLS, DB functions, edge functions — already handled in the sibling project's rename. `is_principal()` still exists as a DB fallback.
- Renaming the `isPrincipal` variable/flag throughout the codebase — pure cosmetic, can be a follow-up.
- Teacher app project (separate Lovable project) — needs its own mirrored update.

### Verification

After build: log in (or simulate) as a `school_leader`-only user → should land on `/teacher`, see all CCAs in the activity filter, and have `canEdit`/`canManageBus` true on all CCA activities/buses.