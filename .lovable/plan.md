## Issue

Parent **Test.junhan** (`junhan@collinz.edu.my`, user `4682ce70…`, parent `bc6d836b…`) was moved from the **Tang** family (`00e3f532…`, GL) to the **Tee** family (`adfe8db6…`, BO). The parent's own row was updated, but the stale links to the 3 Tang children were never removed, so the mobile app still shows all 6 students under "Your Children".

Current state in DB:
- `parents.family_id` → Tee family ✅ (correct)
- `student_parent` → 6 rows (3 Tang + 3 Tee) ❌
- `student_guardians` → 6 rows (3 Tang + 3 Tee) ❌

## Fix

Run a one-time cleanup migration to delete the 3 stale Tang links from both `student_parent` and `student_guardians` for this parent:

Tang student IDs to detach:
- `ff1f5640-d2fa-40c9-84a4-3cc9a71e4de3` — Tang Yican (Doris)
- `aba24874-9ece-4cd9-ae38-ee3e73b34e8d` — Tang Dylan
- `89c03bec-0fd5-476e-a979-c9fe2d7c4718` — Tang Jiaxiang (Felix)

```sql
DELETE FROM public.student_parent
WHERE parent_id = 'bc6d836b-bc70-4d8c-943c-8bb9a993b2a8'
  AND student_id IN (
    'ff1f5640-d2fa-40c9-84a4-3cc9a71e4de3',
    'aba24874-9ece-4cd9-ae38-ee3e73b34e8d',
    '89c03bec-0fd5-476e-a979-c9fe2d7c4718'
  );

DELETE FROM public.student_guardians
WHERE guardian_user_id = '4682ce70-d878-43da-80a5-0d939ae69740'
  AND student_id IN (
    'ff1f5640-d2fa-40c9-84a4-3cc9a71e4de3',
    'aba24874-9ece-4cd9-ae38-ee3e73b34e8d',
    '89c03bec-0fd5-476e-a979-c9fe2d7c4718'
  );
```

After running, the parent's "Your Children" list will only show Tee Pak Jun, Tee Yan Pei, Tee Yan Zhen.

## Note (not in this fix)

The root cause is the parent-swap flow in admin/backoffice: it doesn't sweep `student_parent` / `student_guardians` when moving a parent between families. If you want, I can follow up with a code fix (trigger or admin function) so this stops happening on future swaps — let me know.
