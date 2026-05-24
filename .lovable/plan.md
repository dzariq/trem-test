## What the audit found

Backend is healthy for `junhan@collinz.edu.my`:

- `user_profiles`: `role='teacher'`, `is_active=true`, `user_id=4682ce70-…`
- `user_roles`: `['teacher']`
- RLS on `user_profiles` allows `user_id = auth.uid()` → own profile readable
- `phone-login` edge function: `portal` is optional; teacher role is in the default `allowedRoles` set → should mint a `token_hash` and return 200

So the OTP + token mint path is fine. The bounce-back-to-login is a **client-side handoff bug** after `supabase.auth.verifyOtp` succeeds — the session is set but the Login page either (a) never gets a `(user && profile)` snapshot that triggers the redirect, or (b) `TeacherGuard` rejects on first render before `useUserRoles` resolves.

## Most likely root causes

1. **Race in `useUserRoles` query key change.** When `user` flips from `null → defined` after `verifyOtp`, the query refetches but `isLoading` resets briefly. In `TeacherGuard`, `rolesLoading=true` returns the spinner — fine — but the **redirect-already-fired path in `Login.tsx`** could trigger `navigate('/')` indirectly if any intermediate render shows `user` truthy + `profile` truthy + `hasTeacherRole=false` (because roles haven't refetched yet) + `profile.role === 'teacher'` legacy fallback matches → navigate `/teacher`. That part is OK.
2. **Session not flushed to localStorage in time.** `verifyOtp` returns, listener fires `SIGNED_IN`, but the `Login` redirect `useEffect` may run before `setProfile` finishes (profile still `null`) — and meanwhile something re-renders the form. Less likely given the existing `if (user && profile) return spinner` guard, but worth instrumenting.
3. **`useUserRoles` cache hydration.** Query key `["user-roles", user?.id]` — if the previous session left a cached `[]` under a stale id, the new id gets a clean fetch, but during the fetch `hasTeacherRole=false`. The Login redirect's fallback `["teacher","admin","super_admin"].includes(profile.role)` catches it — so this branch should still fire `/teacher`. Need a log to confirm it actually runs.

## Plan

### 1. Add scoped diagnostic logs (temporary, prefixed `[auth-debug]`)
- `AuthContext`: log every `onAuthStateChange` event + whether profile was fetched + `profile.role`
- `Login.tsx` redirect effect: log `{ authLoading, rolesLoading, user: !!user, profile: profile?.role, hasParentRole, hasTeacherRole, hasStudentRole }` on every run and which branch navigates
- `TeacherGuard` / `ParentStudentGuard`: log `{ loading, rolesLoading, hasTeacherRole, hasParentRole, profile: profile?.role, allowed }` and the redirect target when one fires
- `phone-login` edge function: log `{ emailInput, portalProvided, matchedUserId, matchedRoles }` before returning 200

### 2. Harden Login → Guard handoff
- In `Login.tsx`: after `verifyOtp` succeeds, **proactively `await supabase.auth.getSession()`** to ensure the new session is on the client before relying on the listener, then manually call the same redirect logic (don't depend solely on the `useEffect` re-running).
- In `TeacherGuard` and `ParentStudentGuard`: while `rolesLoading` is true, do **not** redirect — already the case, but tighten by also waiting for the React Query cache to have a settled value (`isFetched`) before evaluating "not allowed", to remove any first-paint race that could land on `/`.
- In `Login.tsx`: guard the redirect effect with `didRedirect` ref so it can't double-fire and cause flicker.

### 3. Verify in preview
- Reproduce login with `junhan@collinz.edu.my`
- Read `code--read_console_logs` for the `[auth-debug]` prefix
- Pull `phone-login` edge function logs to confirm the 200 response and roles matched
- Confirm landing on `/teacher` with `TeacherHomePage` rendered

### 4. Remove debug logs after the fix is confirmed working

## Files to touch

- `src/contexts/AuthContext.tsx` — debug logs only
- `src/pages/Login.tsx` — debug logs + proactive `getSession()` + `didRedirect` guard
- `src/components/auth/TeacherGuard.tsx` — debug logs + `isFetched` race fix
- `src/components/auth/ParentStudentGuard.tsx` — debug logs + `isFetched` race fix
- `src/hooks/useUserRoles.ts` — expose `isFetched` alongside `isLoading`
- `supabase/functions/phone-login/index.ts` — add structured success log

No DB migration, no RLS change, no behaviour change for working accounts.
