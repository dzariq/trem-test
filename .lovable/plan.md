# Audit: Supabase student/parent changes vs. this mobile app

## Findings

### 1. `student_parent.ordinal` (smallint, 1 or 2)
- This mobile app does **not** read or write the `student_parent` table anywhere.
- All parent↔student linking in this codebase goes through `student_guardians` (joined by `guardian_user_id = auth.uid()`), with sorting already handled by `is_primary DESC, created_at ASC` in `src/data/students.ts`.
- `student_parent` only appears in the auto-generated `src/integrations/supabase/types.ts` (read-only types file).
- **Conclusion:** No code change required for the new `ordinal` column. The web project that owns `student_parent` is the one that needs to read/sort by `ordinal`.

### 2. Stricter `is_parent_of_student` RLS (now requires `is_active = true`)
- This RLS function gates all parent-scoped reads (students, attendance, grades, homework, CCAs, notifications, etc.).
- This mobile app already assumes RLS will silently filter out unauthorized rows — it does not crash on empty results; pages render "no data" / loading states gracefully.
- The `useAuth` / `ParentStudentGuard` flow does not check `is_active` on the parent profile itself, so a deactivated parent could still log in and land on parent routes but would simply see empty data everywhere. That matches the intended behaviour you described.
- **Conclusion:** No required change. Optional follow-up (only if you want a nicer UX): add an `is_active` check in `AuthContext` / `ParentStudentGuard` to sign deactivated parents out or show a "Account inactive — contact school" screen instead of empty dashboards. Flag this as optional, not a bug.

## Plan

1. **No code changes** — this project is fully compatible with both Supabase changes as-is.
2. (Optional, only if you confirm) Add an "account inactive" guard so deactivated parents see an explanatory screen instead of empty pages.

Tell me if you want option 2; otherwise this audit is closed.
