## 1. Audit: Student Details drawer (Profile → tap a student)

I cross-checked every field rendered in the drawer (`src/pages/ProfilePage.tsx` lines 708-980) against the source data in `src/data/students.ts` and the live `students` / `student_cca_enrollments` tables.

### Verdict per field
- **Name / Student ID / Email** — sourced from `students.name` / `student_code` / `email`. ✅ Correct.
- **Enrolled / Class / Graduation cards** — `enrollment_date`, `class`, `graduation_year`. ✅ Correct data, but **Class shows `BO-Y1C`** instead of `Y1C`. `formatClassDisplay()` in `src/lib/utils.ts` is currently a no-op, which violates the project rule "Strip campus prefixes from class names." Same bug surfaces anywhere `className` is shown.
- **Visa & Passport block** — only renders when `malaysian_citizen === false`. ✅ Correct (Tang Jia Hao is Malaysian so it's hidden; Bevan/Maya are foreign so it shows). Nationality, visa expiry, passport expiry + number all map correctly. Status pills (Expired / Expiring in Xd / Valid) compute correctly.
- **Meal Plan / Sports House** — `meal_plan` column **does not exist** on `students` (confirmed via DB). The mapping in `students.ts` reads `row.meal_plan ?? row.has_meal_plan` and both are missing, so the Meal Plan tile silently never renders. Either drop the tile or wire it to the correct table/column (need confirmation from you on the source of truth).
- **CCA Clubs & Activities** — uses `useStudentCcaEnrollments(student.id)` (the rich `CcaActivityCard` list) with a badge fallback. DB check confirms Tang Jia Hao really has zero active enrollments → "No clubs joined" is **truthful**, not a bug. Maya Joy Varghese has Taekwondo Club active and will render correctly when selected. ✅

### Fixes to apply
1. Make `formatClassDisplay` actually strip leading `BO-` / `GL-` (case-insensitive) prefixes in `src/lib/utils.ts`. This automatically cleans up the drawer card and every other place that already calls it.
2. Decide on Meal Plan:
   - Option A (default): remove the Meal Plan tile from the drawer since the column doesn't exist.
   - Option B: tell me which table/column holds meal plan and I'll wire it in.

   I'll proceed with **Option A** unless you say otherwise.

No changes needed to the Visa & Passport section or the CCA section logic — those are already correct.

## 2. My CCAs page — add student selector top-right

Update `src/pages/ParentCcaPage.tsx` header so the existing `<ChildSelectorDropdown />` (already used in the home header) sits on the top-right of the sticky header, next to the title.

```text
┌───────────────────────────────────────────────┐
│  ‹  My CCAs                 [ Tang Jia Hao ▾ ]│
└───────────────────────────────────────────────┘
```

Behavior:
- Uses the global `StudentSelectionContext`, so switching here updates the same selected student used by Home, Calendar, Attendance, etc. (consistent with the existing pattern shown in your Calendar screenshot).
- Removes the redundant "Showing CCAs for {name}" caption beneath the header since the dropdown already shows the name.
- Empty state already reads "{name} isn't enrolled in any CCAs yet." — kept as-is.

### Files to touch
- `src/lib/utils.ts` — fix `formatClassDisplay` to strip `BO-` / `GL-` prefixes.
- `src/pages/ProfilePage.tsx` — remove the Meal Plan tile (Option A).
- `src/pages/ParentCcaPage.tsx` — add `<ChildSelectorDropdown />` in the header, drop the caption row.

No backend / RLS / migration changes.
