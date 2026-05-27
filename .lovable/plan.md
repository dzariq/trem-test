## What's actually wrong

Nothing was deleted from Supabase. The `announcements` table has 3 active, published rows:

| id (short) | Title | Campus |
|---|---|---|
| 960e7d54 | Subject: End-of-Term Staff Meeting — Jun 12 | BO |
| 22a25869 | Collinz DNA | BO |
| b2463d88 | Collinz DNA | GL |

- The **web admin screenshot** shows only 1 because it's filtered to campus **GL** — the other 2 are on **BO**, not deleted.
- The **mobile app** correctly shows the 2 BO rows for that BO parent.

There is no `deleted_at` / soft-delete column on `announcements`, and `is_active = true` on all three. So the web admin's "Delete" button is not actually issuing a `DELETE` (or it's silently failing under RLS) — it only looked deleted on the web because the campus filter hid the BO rows.

## Plan

### 1. Hard-delete the one stale row (per your answer)

Run a migration that deletes id `960e7d54-31df-4fea-b150-f3027e1e6dba` (End-of-Term Staff Meeting, BO) plus its related child rows so we don't hit FK errors:

```sql
DELETE FROM public.announcement_reads        WHERE announcement_id = '960e7d54-...';
DELETE FROM public.announcement_acknowledgements WHERE announcement_id = '960e7d54-...';
DELETE FROM public.announcement_attachments  WHERE announcement_id = '960e7d54-...';
DELETE FROM public.announcement_targets      WHERE announcement_id = '960e7d54-...';
DELETE FROM public.announcements             WHERE id = '960e7d54-...';
```

(Exact child-table list will be verified against the schema before running; only tables that exist are touched.)

Keep the two "Collinz DNA" rows — you confirmed they stay.

### 2. Flag the real bug, which lives in the sibling web-admin project

This Lovable project is the **parent mobile app**. The admin web UI in your screenshot is the **sibling project** (`57f7d946-02ac-4a33-a37a-37b7bec9402a`) on the same Supabase. I can't edit its code from here.

Likely cause of the failed delete on web admin (to fix in that project):
- Delete handler probably calls `supabase.from('announcements').update({ is_active: false })` or similar instead of `.delete()`, **or**
- It calls `.delete()` but RLS on `announcements` blocks the admin role, and the error is swallowed (no toast).

I will write a follow-up note recommending you ask the web-admin project to:
- Verify the Delete button calls `.delete().eq('id', …)` and surfaces errors via toast.
- Confirm the admin's RLS DELETE policy on `announcements` allows `is_admin_like(auth.uid())`.

### 3. Nothing to change in this (mobile) project

Mobile is showing the truth of the database. Once the row is gone, mobile will stop showing it on next refresh.

## Technical notes

- Migration is a pure data delete on the `public` schema, no schema/RLS changes.
- Child-table cascade depends on existing FKs; if `ON DELETE CASCADE` is already in place, the child DELETEs are redundant but harmless.
- After the migration: mobile will show only **Collinz DNA (BO)** for BO parents; the GL "Collinz DNA" stays for GL users.
