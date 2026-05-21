# Stabilise teacher CCA detail loading

## What's wrong today

`TeacherCcaDetailPage` derives the visible activity from `useTeacherInvolvedCcas(activeCampus)` — the same hook the list page uses. The detail screen renders **"Not found / no access"** whenever `activities.find(id)` returns nothing, and that happens transiently in several real situations:

1. **Direct navigation / hard refresh.** First render: `loading=false`, `activities=[]` (initial state) before the effect runs. The "Not found" guard fires for a frame.
2. **Auth not ready yet.** The hook early-returns (`!uid`) without setting `loading=true`. While `AuthContext.loading` is still true, the page sees `loading=false` + empty list → "Not found".
3. **Campus context flips.** When `activeCampus` resolves from `null` to `"BO"/"GL"`, the hook refetches. Between effect ticks, `loading` briefly drops to `false` with the old/empty list before the new fetch starts.
4. **Heavy list payload.** The hook fans out N+1 queries (activity-teachers → per-teacher `get_teacher_public_info` RPC → sessions). On a slow link the list takes seconds, so the detail page is gated on data it doesn't actually need.

Net effect: the card opens, flashes "Not found", and only "reconnects" once the full list query settles.

## Fix

Decouple the detail page from the list query. Fetch **just this one activity** by id, gated on auth being ready, and compute access locally.

### 1. New hook `useCcaActivityById(activityId)`

`src/hooks/useCcaActivityById.ts` — returns `{ activity, loading, error, refetch }` shaped like one `InvolvedCcaActivity` entry. Behaviour:

- Wait for `useAuth().loading === false` and `user?.id` before querying. While auth is loading, return `loading: true` (never `notFound`).
- Single query to `cca_activities` by `id` with the same selects the list hook uses (types, venue, year_levels, classes_involved, kind, campus_code, image_url, etc.).
- Parallel follow-ups (only if the activity row resolves): `cca_activity_teachers` for this `activity_id` → resolve teacher names via `get_teacher_public_info`; `cca_outdoor_buses` for this `activity_id` to detect bus-PIC role; `cca_sessions` for this `activity_id` (non-cancelled, ascending).
- Compute `myRole` exactly like `useTeacherInvolvedCcas` (PIC > co-pic > bus-pic).
- Expose a discriminated result: `status: "loading" | "ready" | "not_found" | "forbidden" | "error"`. `not_found` only when the activity query returns no row AND auth is ready AND no campus race is in flight. `forbidden` when the row loads but `useCcaActivityPermissions` returns `canView=false`.

### 2. Rewire `TeacherCcaDetailPage`

`src/pages/teacher/TeacherCcaDetailPage.tsx`:

- Replace `useTeacherInvolvedCcas` + `activities.find(...)` with `useCcaActivityById(activityId)`.
- Replace the existing two-branch guard with:
  - `status === "loading"` → existing skeleton.
  - `status === "forbidden"` → keep "no access" copy.
  - `status === "not_found"` → keep "not found" copy.
  - `status === "error"` → small error card with a Retry button calling `refetch()`.
  - otherwise render the page using the returned `activity`.
- Pull-to-refresh now calls `refetch()` + `fetchSessions()`.

### 3. List page stays as-is

`TeacherCcaPage` continues to use `useTeacherInvolvedCcas` for the grid. No behavioural change there; we just stop coupling the detail screen to it.

### 4. Small resilience tweaks (low risk)

- In `useCcaActivityById`, swallow individual sub-fetch failures (teachers/sessions/buses) and still render the activity — never let a slow `get_teacher_public_info` call turn the page into "Not found".
- Add a 200 ms debounce-style guard: don't flip `status` to `not_found` until at least one completed fetch attempt with `user.id` present, to absorb auth/campus flips.

## Files touched

- add `src/hooks/useCcaActivityById.ts`
- edit `src/pages/teacher/TeacherCcaDetailPage.tsx` (only the data-loading + guard block; UI body unchanged)

## Out of scope

- No DB / RLS / edge-function changes — RLS is already correct; this is purely a client-side syncing bug.
- No changes to the CCA list page, parent flows, or attendance components.
