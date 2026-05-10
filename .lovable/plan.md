## Summary

After auditing this project (the parent/teacher mobile app), **no code changes are required** to sync with the new per-subject `grade_configurations` work done in the other Lovable project.

## Findings

A repo-wide search for every affected symbol returned only generated types and one unrelated reference:

| Symbol | Where found | Action |
|---|---|---|
| `grade_configurations` table | `src/integrations/supabase/types.ts` only | None — auto-generated, will refresh on next type sync |
| `selected_subject_ids` (deprecated col) | `src/integrations/supabase/types.ts` only | None — not read or written anywhere in app code |
| `upsert_default_grade_config` / `upsert_subject_grade_configs` / `reset_subject_grade_configs` RPCs | `types.ts` only | None — RPCs already typed and available if we ever need them |
| `get_or_create_grade_config` RPC | `types.ts` only | None |
| `mark_types` column | `types.ts` only | None |
| `gradeConfig` in `src/pages/AcademicPage.tsx:1830` | Local UI variable for letter-grade color tokens | Unrelated — not the DB table |
| Comment in `src/data/gradeEntry.ts:415` | Stale comment mentioning `grade_configurations.additional_columns` | Optional cleanup, no behavior impact |

### Why nothing breaks here

- This mobile app **never queries or mutates `grade_configurations`** directly. Grading-status logic lives on `academic_periods` and `student_grades`, not on the configuration table.
- The risk the other project flagged ("any `.single()` query on `(year_level, class, academic_period_id)` will break now that multiple rows exist") **does not apply** — we have zero such queries.
- The new unique partial indexes and RPCs are server-side only; we touch neither.

### Schema note worth flagging back to the other project

The other project's summary describes `p_subject_ids` as `uuid[]`, but in this project's live Supabase types `subjects.id` and `grade_configurations.subject_id` are **integers**, and the new RPCs are typed as `p_subject_ids: number[]`. Either the other project's summary has a typo, or the two projects are pointing at different Supabase instances. Worth confirming with them — but again, no impact on this codebase.

## Plan

1. **No code changes.** This project is already compatible with the new per-subject configuration model.
2. **(Optional, tiny cleanup)** Remove the stale comment in `src/data/gradeEntry.ts:415` that references `grade_configurations.additional_columns`, since that column was never used here and the comment is misleading. Skip this if you'd rather leave it alone.
3. **No migration needed.** The DB changes were applied in the other project against the same Supabase instance (assuming shared backend), so they're already live for us too.
4. **Going forward**, if we ever add grading-config UI to this mobile app, use the new RPCs (`upsert_default_grade_config`, `upsert_subject_grade_configs`, `reset_subject_grade_configs`) instead of direct table upserts, and never call `.single()` on `(year_level, class, academic_period_id)` without also filtering `subject_id`.

## Question for you

Do you want me to apply the optional comment cleanup in step 2, or leave the codebase fully untouched?