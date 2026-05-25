# Fix: Visa module empty even though student profile shows visa

## Root cause

The last fix added `get_my_family_parents()` / `get_my_family_students()` RPCs so the page can *list* parents and students across every family the logged-in user is linked to. But the follow-up queries against the visa tables still go through their original RLS policies:

- `student_visa_records` / `student_visa_periods` — `USING is_parent_of_student(student_id)` (i.e. only rows where the user is in `student_guardians`)
- `parent_visa_records` / `parent_visa_periods` — `USING parents.parent_user_id = auth.uid()` (only your own parent row)

So for a parent linked to a 2nd family without a `student_guardians` backfill (e.g. user `4682ce70` → Bevan), the RPC returns the student, but `.in("student_id", ids)` on `student_visa_records` returns nothing — hence the Visa module stays empty while the student-profile dialog (which reads the single `students.visa_expiry_date` column) still shows a date.

## Fix

Add two more SECURITY DEFINER RPCs that return visa rows scoped to the caller's families (bypassing the narrow per-record RLS, but only for IDs that already pass the family scope). Then have the data layer fetch visa data via those RPCs instead of direct table queries.

### Migration

1. `get_my_family_student_visa()` → returns rows from `student_visa_records` where `student_id` is in `get_my_family_students()`.
2. `get_my_family_student_visa_periods()` → same scope, from `student_visa_periods`, ordered by `issue_date desc nulls last`.
3. `get_my_family_parent_visa()` → returns rows from `parent_visa_records` where `parent_id` is in `get_my_family_parents()`.
4. `get_my_family_parent_visa_periods()` → same scope, from `parent_visa_periods`, ordered by `issue_date desc nulls last`.

All four: `language sql stable security definer set search_path = public`, `grant execute … to authenticated`. No RLS changes — existing per-record policies stay intact (mobile app contract preserved, admin tools unaffected).

### `src/data/visa.ts`

- `fetchMyFamilyParentsVisa` — replace `.from("parent_visa_records")` / `.from("parent_visa_periods")` with `supabase.rpc("get_my_family_parent_visa")` / `supabase.rpc("get_my_family_parent_visa_periods")`. Drop the `.in("parent_id", parentIds)` filter (RPC already scopes).
- `fetchMyChildrenVisa` — same swap to `get_my_family_student_visa` / `get_my_family_student_visa_periods`.

### Out of scope

- No UI changes to `VisaPage.tsx`.
- No RLS changes on visa tables.
- No backfill of `student_guardians`.
- Sibling mobile project — same RPCs will be available; will update the existing handoff note after this lands.

## Why this is safe for the shared mobile app

- Purely additive: new RPCs, no renames, no dropped policies.
- Mobile app's current direct table queries keep working unchanged.
- Mobile app can later swap to the same RPCs to get the same family-wide visibility fix.
