---
name: shared-supabase-backend
description: This project shares its Supabase backend with a sibling Lovable mobile app. Apply whenever making schema changes, migrations, RLS edits, edge functions, auth flows, storage, or anything touching Supabase — coordinate so changes don't break the other app.
---

# Shared Supabase Backend

This project and a separate Lovable **mobile app** project both connect to the **same Supabase instance**.

Sibling mobile app: https://lovable.dev/projects/57f7d946-02ac-4a33-a37a-37b7bec9402a

## Implications — always consider before changes

1. **Schema migrations** — prefer additive (new nullable columns, new tables). Avoid renames/drops without confirming the other app doesn't reference them.
2. **RLS policies** — must keep both parent/student and teacher/admin access paths working. Don't tighten policies without checking the other app's consumers.
3. **Edge functions** (`phone-login`, `send-email-otp`, etc.) — shared. Both apps invoke them. Don't change request/response shape unilaterally.
4. **Auth / user_roles** — both apps validate roles against `user_roles`. Changes to the `app_role` enum or role checks affect both.
5. **Feature flags** — `VITE_FEATURE_*` are per-app. Don't assume parity between apps.
6. **Storage buckets** — shared. Keep path conventions consistent.
7. **Generated types** (`src/integrations/supabase/types.ts`) — regenerate after schema changes; the other app keeps its own copy and must do the same.

## Behavior rule

When making any Supabase-touching change, call it out in the response and warn the user when a corresponding update on the sibling app is required. Prefer backwards-compatible migrations (keep old column until the other app migrates).