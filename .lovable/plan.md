

## Regenerate Supabase Database Types

This is a straightforward task: regenerate the TypeScript types from the current Supabase schema so the frontend reflects the latest database migrations.

### What will happen

The Supabase types file at `src/integrations/supabase/types.ts` will be regenerated from the live database schema. This is an automated process — no manual code changes needed.

### Expected new types to appear

After regeneration, the types file should include:

1. **`user_campuses` table** — with `id`, `user_id`, `campus_id`, `campus_code`, `is_primary`, `created_at`
2. **`campus_code` column** on: `students`, `lesson_plans`, `homework_assignments`, `attendance`, `announcements`, `calendar_events`, `class_years`, `parent_tickets`, `academic_periods`, `subjects`, `subject_selections`, `campuses`
3. **`app_role` enum** including `super_admin`
4. **`campuses.campus_code`** column

### Verification

After regeneration, I will read the updated types file and confirm each of the four items above is present. No other changes will be made.

