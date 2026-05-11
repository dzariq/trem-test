# Fix Grade Entry subject dropdown (teacher view)

## Problem

When a teacher selects **Y4C / 2026**, the subject dropdown lists Y10/Y11 subjects (Accounting, Add Math, Biology, Chemistry, Business Studies, etc.). Verified in DB: the teacher `Test.junhan` has `teacher_assignments` rows for `class_year_id = 71 (GL-Y4C)` pointing to subjects whose `subjects.year_levels` are `[Y10, Y11]` only. The current code in `useTeacherScope.getAllowedSubjects` blindly returns every assignment row without filtering by year level or by what's actually configured for the selected exam term.

## Fix (teachers only — admin path is unchanged)

### 1. Filter by class year level
In `src/hooks/useTeacherScope.ts` → `getAllowedSubjects`, after fetching the teacher's assigned subjects for the class, drop any subject whose `subjects.year_levels` does not contain the class's `year_level` (e.g. `Y4`). Use exact array membership (`.includes("Y4")`), not a substring match — the existing `fetchSubjects` uses a buggy `yearLevel.includes(yl)` check that would let `Y1` match `Y10`. Pass the class's `year_level` into `getAllowedSubjects` (or look it up from `allClassYears` inside the function).

### 2. Further filter by selected exam term
In `src/hooks/useGradeEntry.ts`, after subjects + period are known, narrow the dropdown to subjects configured for that period:

- Query `grade_configurations` for the row matching `(year_level, class, academic_period_id)` where `subject_id IS NULL` (the class default), and read its `selected_subject_ids` array.
- If `selected_subject_ids` is non-empty, intersect the subject list with it.
- If no config row exists or `selected_subject_ids` is empty/null, fall back to the year-level filter only (so nothing breaks for un-configured periods).

Re-run this filter whenever `selectedClass`, `selectedPeriod`, or the raw subjects list changes. Reset `selectedSubject` if it falls out of the filtered list (toast: "Selected subject is no longer available for this term").

### 3. Cache invalidation
The existing `subjectsCache` in `useTeacherScope` is keyed by `(userId, classYearId)`. Year-level filtering can stay inside that cached result (year level is stable per class). The exam-term filter is applied in `useGradeEntry` on top of the cached list — no cache changes needed.

## Out of scope (per your answers)

- Admin / non-teacher path (`fetchSubjects`) — left as-is.
- No data cleanup of `teacher_assignments` rows — the UI just hides mismatches.
- No DB migration; `grade_configurations.selected_subject_ids` already exists.

## Files touched

- `src/hooks/useTeacherScope.ts` — add year-level filter inside `getAllowedSubjects`.
- `src/hooks/useGradeEntry.ts` — add exam-term filter layer + reset selected subject when filtered out.
