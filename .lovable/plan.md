# Simplify & expand the Visa page

Tightens the parent-facing Visa view so everything (parents + children passport + visa) is visible at a glance, without noisy placeholder text.

## Scope
File: `src/pages/VisaPage.tsx` + `src/data/visa.ts` (data layer).

## Changes

### 1. Validity line — smarter formatting
In `PeriodCard`, replace:
```
Validity: — → 11 Mar 2027
```
with logic:
- Both dates → `Validity: 11 Mar 2025 → 11 Mar 2027`
- Only expiry → `Valid until: 11 Mar 2027`
- Only issue → `Issued: 11 Mar 2025`
- Neither → hide the line entirely

### 2. Remove "Backfilled from student record" noise
Drop the `notes` rendering when the note equals "Backfilled from student record" (case-insensitive). Real teacher/admin notes still show.

### 3. Add passport + nationality summary for each person
New compact "Passport" mini-section rendered above the visa period card(s) for:

**Parent (self):** name, nationality, passport number, passport expiry.
**Each child:** name, nationality, passport number, passport expiry.

Pulled from existing columns (no schema change):
- `parents`: `passport_number`, `passport_expiry_date`, `nationality`
- `students`: `passport_number`, `passport_expiry_date`, `nationality`

If passport expiry is within 90 days → amber chip "Expiring soon"; if past → red "Expired".

### 4. Always show sections (even without visa periods)
Currently "My Visa" only shows if parent has a `parent_visa_records` row. Change so that:
- If the parent has *any* passport info OR visa record → show "My Visa" section with passport header + (visa cards or a soft "No immigration pass recorded yet").
- Children section already iterates by visa record; switch to iterating over *all linked children* so passport-only kids still appear.

### 5. Empty state
Only show the big "No visa records yet" empty state when both parent and all children have neither passport nor visa data.

## Data layer (`src/data/visa.ts`)

- Extend `fetchMyParentVisa` to also fetch the parent's `parents` row (`passport_number, passport_expiry_date, nationality, full_name`) for the authenticated user and return it as `self`.
- Replace `fetchMyChildrenVisa` student-list source: query the parent's linked students directly (same join used elsewhere in the app, e.g. `useStudentSelection`) selecting `id, name, passport_number, passport_expiry_date, nationality`, then left-join visa records/periods. This guarantees every child shows up.

## Out of scope
- No DB migrations, no RLS changes, no edits to teacher/admin visa management screens.
- Mobile-app schema contract preserved (read-only additive use of existing columns).
