## Goal
Confirm that nothing broke after the recent security migrations (column-level grants on `cca_activities` / `parent_tickets`, realtime publication trims, `check_phone_exists` grant tightening, storage policy swap, `parent_tickets` parent-read policy).

## What I'll verify (read-only — no code changes)

### 1. Edge Functions
- `send-email-otp`
  - POST with a valid email → expect 200 `{ success: true, ttl_seconds: 300 }`
  - POST with invalid email → expect 400
  - Hit rate-limit (6th call within 15 min) → expect 429
  - Check Edge Function logs for hidden errors
- `phone-login` (email path)
  - POST without OTP → expect 400 (`OTP code is required`)
  - POST with bogus OTP for a real email → expect 401 (`Invalid OTP code.`)
  - POST with unknown email → expect 404
  - Wrong-portal email → expect 403 with portal hint
  - Check logs for unexpected errors
- `phone-login` (phone path)
  - POST without country_code → expect 400
  - POST with unknown phone → expect 404

### 2. Database RPCs touched by hardening
- `check_phone_exists(text)` — confirm `anon` cannot EXECUTE; `authenticated` still can.
- `can_write_grades`, `get_eligible_cca_activities`, `is_ticket_owner`, `is_admin_like` — quick `EXECUTE` grant + `SECURITY DEFINER` + `search_path` sanity check via `pg_proc`.

### 3. RLS smoke-checks
- `parent_tickets` — confirm the new authenticated SELECT policy exists alongside admin/teacher policies (re-run `pg_policies`).
- `cca_activities` — confirm column-level SELECT still works for whitelisted columns and the frontend hooks (`useCcaActivities`, `useCcaSessions`, `useEligibleCcaActivities`) compile against the trimmed type set (already verified earlier — re-grep for any new references to `internal_notes` / `budget_*`).
- Realtime publication — re-list `pg_publication_tables` to confirm only `attendance` + `notifications` remain.

### 4. Storage
- `announcement-attachments` bucket — confirm a signed URL / authenticated fetch still works; confirm anonymous fetch is denied.

### 5. Frontend regression scan
- `rg` for any remaining usage of removed/restricted columns (`internal_notes`, `budget_total`, `budget_notes`) and any realtime subscriptions on the dropped tables (`students`, `enrollments`, `student_grades`, `student_visa_*`).

## Deliverable
A single report listing each check, the observed result, and (if anything is broken) a follow-up fix proposal — no migrations or code edits unless an issue surfaces and you approve the fix.
