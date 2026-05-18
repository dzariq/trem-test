# CCA Permission Model — Audit & Implementation Plan

## What's already correct in the DB ✅

The Supabase backend already matches most of the spec:

| Spec requirement | Current state |
|---|---|
| Tables `cca_activities`, `cca_activity_teachers` (with `is_primary`), `cca_club_year_eligibility`, `cca_outdoor_buses` (`teacher_pic_main` / `teacher_pic_sub`), `cca_bus_assignments` (with `attended`, `marked_by`, `marked_at`) | ✅ all exist |
| Helper functions `is_admin_like()`, `is_teacher()`, `is_parent()`, `is_super_admin()`, `is_cca_pic(uuid)`, `teacher_assigned_to_cca(uuid)` | ✅ all exist |
| `cca_outdoor_buses` writes → principal OR activity PIC | ✅ (`is_admin_like()` OR `is_cca_pic(activity_id)`) |
| `cca_bus_assignments` writes → principal OR activity PIC OR bus PIC main/sub | ✅ exact match |
| `cca_activity_teachers` writes → principal only | ✅ admin-only |
| `cca_club_year_eligibility` writes → principal only | ✅ admin-only |
| `cca_activities` UPDATE → principal OR activity PIC | ✅ |
| SELECT on all CCA tables also allows `is_teacher()` for year-overlap reads | ✅ |

## Gaps to close

### 1. DB — `is_principal()` alias

Spec uses `is_principal()`. We have `is_admin_like()` (= `super_admin` ∨ `admin` ∨ `principal`). Two ways:

- **A.** Add `is_principal()` as `SECURITY DEFINER` returning `is_admin_like()`. Cheapest, keeps existing RLS valid. *(Recommended.)*
- **B.** Add a strict `is_principal()` that returns true **only** for role `'principal'` and migrate every relevant RLS policy. Big blast radius across the school.

Open question — which? See bottom.

### 2. DB — INSERT policy on `cca_activities`

Current: `Admins or PICs can insert activities` has `WITH CHECK = is_admin_like() AND campus check` — i.e. **PICs cannot actually insert** despite the policy name. Spec says INSERT → principal only, so this is fine. Rename the policy to remove the misleading "or PICs".

### 3. Mobile app — single permission hook

Add `src/hooks/useCcaActivityPermissions.ts`:

```ts
useCcaActivityPermissions(activity) → {
  isPrincipal,           // admin_like role from useMyProfile
  isActivityPIC,         // row in cca_activity_teachers for auth.uid()
  hasYearOverlap,        // teacher year-levels ∩ activity year set
  canView,               // principal OR PIC OR yearOverlap
  canEdit,               // principal OR PIC
  canEditBuses,          // alias of canEdit (for non-bus-specific calls)
}
```

Data sources reuse existing hooks: `useMyProfile`, `useTeacherScope`, `useCcaActivities` (already exposes `kind`, `year_levels`).

For clubs, year set comes from `cca_club_year_eligibility`; for outdoor/event, from `cca_activities.year_levels`. The hook fetches eligibility lazily only when needed.

### 4. Mobile app — per-bus permission hook

Add `src/hooks/useCcaBusPermissions.ts`:

```ts
useCcaBusPermissions(bus, activity) → {
  canViewBus,    // canView(activity)
  canManageBus,  // canEdit(activity) OR uid == bus.teacher_pic_main OR bus.teacher_pic_sub
}
```

### 5. Mobile app — list filter

Add `src/hooks/useCcaActivityFilter.ts`:

- Principal → no filter.
- Teacher → keep activities where they are PIC OR year overlap.
- Parent → unchanged (eligibility hook already covers them).

Apply in `useCcaActivities` (teacher path) and any list page. Hide "Add" / management buttons via `isPrincipal` from the permission hook.

### 6. Mobile app — wire the hooks into existing surfaces

| Surface | Change |
|---|---|
| `CcaDetailsSheet.tsx` | Deny render if `!canView`; pass `canEdit` to all child actions; hide PIC-only CTAs from year-overlap teachers |
| `SessionDetailsSheet.tsx` | Replace ad-hoc PIC check in `useCcaSessionAttendance` with `canEdit` from the new hook |
| `SessionAttendanceList.tsx` | Receive `canEdit` as prop; read-only when false |
| New `BusListSection` (outdoor sessions only) | Render bus cards; for each, use `useCcaBusPermissions` to decide if mark-attendance is enabled |
| `useCcaSessionsCalendar.ts` (teacher path) | Replace year-only filter with the unified `canView` rule (PIC OR yearOverlap) |

### 7. Bus attendance UI (mobile, teacher only)

This is the **new feature** beyond hooks. For each outdoor `cca_session`:

- Fetch `cca_outdoor_buses` for the session's `activity_id`.
- For each bus, fetch `cca_bus_assignments` (student + `attended`).
- Render a bus card per bus showing name, capacity, PIC main/sub, assigned students with a present/absent toggle.
- Disable the toggle when `useCcaBusPermissions(bus, activity).canManageBus === false`.

Parents → still **not** shown. Buses are teacher-only.

## Files to add

- `src/hooks/useCcaActivityPermissions.ts`
- `src/hooks/useCcaBusPermissions.ts`
- `src/hooks/useCcaActivityFilter.ts`
- `src/hooks/useCcaOutdoorBuses.ts` (fetch buses + assignments + mark-attendance mutation)
- `src/components/cca/BusListSection.tsx`
- `src/components/cca/BusAttendanceList.tsx`

## Files to edit

- `src/hooks/useCcaActivities.ts` — apply `useCcaActivityFilter` for teachers
- `src/hooks/useCcaSessionsCalendar.ts` — same filter for teacher calendar
- `src/hooks/useCcaSessionAttendance.ts` — adopt `canEdit` from new hook
- `src/components/cca/CcaDetailsSheet.tsx` — gate by `canView`, pass `canEdit` down
- `src/components/cca/SessionDetailsSheet.tsx` — mount bus list when `kind === 'outdoor'`
- `src/components/cca/SessionAttendanceList.tsx` — receive `canEdit` prop

## Migration (small)

```sql
-- Optional alias matching spec's wording
CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT public.is_admin_like();
$$;

-- Rename misleading policy on cca_activities (purely cosmetic)
ALTER POLICY "Admins or PICs can insert activities" ON public.cca_activities
  RENAME TO "Principals can insert activities";
```

## Test matrix (matches your table)

| User | View club | Edit club | Bus attendance |
|---|---|---|---|
| Principal | ✅ | ✅ | ✅ all |
| Activity PIC | ✅ | ✅ | ✅ all |
| Year-overlap teacher | ✅ | ❌ | ❌ |
| Bus PIC only (not activity PIC) | ✅ (via teacher SELECT) | ❌ | ✅ that bus only |
| Unrelated teacher | ❌ | ❌ | ❌ |
| Parent | ❌ (read-only summaries via eligibility hook) | ❌ | ❌ |

The "Bus PIC only" row in the spec is already covered by the existing RLS using `b.teacher_pic_main = auth.uid() OR b.teacher_pic_sub = auth.uid()`. No gap.

## Out of scope (confirm)

- The admin web app (separate repo). Spec mentions tabs PICs / Roster / Budget / Awards / Venue / Sports / Roles — none of those tabs exist in **this** mobile project. I'll implement hooks + bus attendance here; admin-web tabs are a separate ticket.
- Renaming `is_admin_like()` everywhere to `is_principal()` (only adding an alias).
- Parent-side bus visibility (explicitly excluded by spec).

## Open questions

1. **`is_principal()` semantics** — alias of `is_admin_like()` (includes admin + super_admin + principal) ✓ recommended, OR strict-`'principal'` only? The latter changes who can edit clubs/activities across every existing app reading this DB.
2. **Bus attendance UI scope** — do you want it built **now** in the mobile teacher calendar (alongside the existing session attendance list), or only the **permission scaffolding** and bus UI later?
3. **Year-overlap teacher view of the activity detail sheet** — show all tabs as read-only, or hide tabs like Budget / Roles entirely?

Answer those three and I'll implement.
