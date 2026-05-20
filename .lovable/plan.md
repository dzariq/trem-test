Save a project-scoped skill that captures: this web/admin app and a sibling Lovable mobile app (https://lovable.dev/projects/57f7d946-02ac-4a33-a37a-37b7bec9402a) share the **same Supabase backend**. Any Supabase-touching change must consider both apps.

## What gets created

`.agents/skills/shared-supabase-backend/SKILL.md` with:

- **Trigger description** so it auto-surfaces on Supabase work (migrations, RLS, edge functions, auth, user_roles, storage, generated types).
- **Sibling mobile app URL** for reference.
- **Implications checklist** the agent must apply:
  1. Schema migrations — prefer additive; avoid renames/drops without checking mobile.
  2. RLS — keep both parent/student (mobile) and teacher/admin (web) access paths intact.
  3. Edge functions (`phone-login`, `send-email-otp`, etc.) — shared; don't change request/response shape unilaterally.
  4. Auth & `user_roles` / `app_role` enum changes affect both apps.
  5. `VITE_FEATURE_*` flags are per-app — don't assume parity.
  6. Storage buckets shared — keep path conventions consistent.
  7. Regenerate `src/integrations/supabase/types.ts` after schema changes; mobile must do the same.
- **Behavior rule**: when making a Supabase change, call it out in the response and warn the user when a corresponding mobile update is required. Prefer backwards-compatible migrations.

## Activation

After writing the draft, call `skills--apply_draft` on `.agents/skills/shared-supabase-backend` to activate it.

Switch to build mode to apply.