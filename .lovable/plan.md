## Finding

`technical@quad-data.com` is correct in Supabase: the account has both roles:

- `parent`
- `teacher`

The Android issue is likely not RLS. The app currently has **two Supabase clients**:

- `src/lib/supabase.ts` — used by login/auth and configured for Android with Capacitor Preferences storage.
- `src/integrations/supabase/client.ts` — used by `useUserRoles`, but configured only with `localStorage`.

On Android WebView, this means login succeeds through the native-aware client, but the role query can run through a different client that may not share the same persisted session/token. That can make `user_roles` return incomplete or unreliable results after OTP login.

## Plan

1. Update `src/hooks/useUserRoles.ts`
   - Change the Supabase import from `@/integrations/supabase/client` to `@/lib/supabase`.
   - Keep the cache-busting settings already added (`staleTime: 0`, `gcTime: 0`, refetch on mount/focus/reconnect).
   - Add a small fallback: if the role query errors because the session is not ready, call `supabase.auth.getSession()` once before retrying the `user_roles` query.

2. Audit other parent-mobile-critical files still using the generated client
   - `src/data/visa.ts`
   - `src/pages/VisaPage.tsx`
   - `src/hooks/useHasVisaModule.ts`

   If they depend on authenticated parent data, switch them to `@/lib/supabase` too so Android uses the same session storage everywhere.

3. Keep database/RLS unchanged
   - No migration is needed because Supabase already confirms the account has both roles.
   - This is a frontend/native session-client mismatch fix.

4. Validate after implementation
   - Verify `useUserRoles` logs both `parent` and `teacher` for `technical@quad-data.com`.
   - Confirm the `PortalSwitcher` becomes visible for dual-role users after OTP login.

## Mobile app impact

This is safe for the shared Supabase backend because it does not change tables, RLS policies, auth settings, or edge functions. It only makes the Android app use the same native-aware Supabase client for role checks as it already uses for login.