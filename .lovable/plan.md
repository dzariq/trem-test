## Goal

When a user logs in via **Email OTP** on the Parent / Student portal:
1. First try the existing parent lookup (user_profiles + `parent` role).
2. If no parent match, look up `students.email` for that email.
3. If a student is found, mint a Supabase session for that student and route them to a new `/students` area that reuses all parent pages/layouts.

## Backend — `supabase/functions/phone-login/index.ts`

Email path only (phone path unchanged):

1. After the current parent lookup fails with "No parent account found":
   - Query `students` where `lower(email) = emailInput` and `archived = false`.
   - If 0 rows → return the existing "no account" error.
   - If found:
     - If `students.user_id` is null:
       - `admin.auth.admin.createUser({ email, email_confirm: true })` (or `getUserByEmail` first if it exists).
       - Update `students.user_id = newAuthUser.id`.
     - Ensure a `user_roles` row exists with `role = 'student'` for that `user_id` (insert-on-conflict-do-nothing).
     - Ensure a minimal `user_profiles` row exists (`user_id`, `email`, `role='student'`, `is_active=true`, `full_name = students.name`) — upsert by `user_id`. This is needed because `AuthContext` fetches `user_profiles`.
   - Call `admin.auth.admin.generateLink({ type: 'magiclink', email })` and return `{ email, token_hash, user_id, account_type: 'student' }`.

No schema migration is required — `students.user_id`, `user_roles.role='student'`, and `user_profiles` already exist.

## Frontend

### `src/hooks/useUserRoles.ts`
- Add `hasStudentRole = roles.includes('student')`.

### `src/components/auth/ParentStudentGuard.tsx`
- Allow access when `hasParentRole || hasStudentRole || allowedRoles.has(profile.role)`. (Already allows legacy `student`/`user` profile.role, this adds the authoritative `user_roles` check.)

### `src/contexts/StudentSelectionContext.tsx`
- If `hasStudentRole && !hasParentRole`, instead of `listMyLinkedStudents()` (which uses guardian links), load the single `students` row where `user_id = auth.uid()` and treat it as the only "linked student". Selector UI then naturally shows just themselves.
- Helper added to `src/data/students.ts`: `getMyStudentSelfRecord()`.

### `src/pages/Login.tsx`
- Redirect logic: if `hasStudentRole && !hasParentRole` → `navigate('/students')`. Otherwise unchanged.

### `src/App.tsx` — new `/students` route group
Reuses **the exact same parent page components**, wrapped in the same `ParentStudentGuard`:

```
/students                  → HomePage
/students/attendance       → AttendancePage
/students/academic         → AcademicPage
/students/calendar         → CalendarPage
/students/invoice          → InvoicePage
/students/support          → SupportPage
/students/profile          → ProfilePage
/students/notifications    → NotificationsPage
/students/announcements    → AnnouncementsPage
/students/announcements/:id→ AnnouncementDetailPage
/students/security-privacy → SecurityPrivacyPage
/students/privacy-policy   → PrivacyPolicyPage
/students/contact          → ContactPage
/students/awards           → AwardsPage
/students/handbook         → StudentHandbookPage
/students/visa             → VisaPage
/students/cca              → ParentCcaPage
/students/cca/:activityId  → ParentCcaDetailPage
```

No changes to the page components themselves — they continue to read `selectedStudentId` from `StudentSelectionContext`, which now resolves to the student's own record.

### Navigation
- `BottomNavigation` and `AppHeader` link prefixes today are hard-coded to `/parent/*`. For the first pass, leave them as-is — the routes will still work because both groups render the same components and resolve to the same data. (Optional follow-up: dynamic prefix based on `hasStudentRole`.)

## Out of scope
- No changes to teacher portal.
- No new tables, no RLS changes (`students` SELECT already restricted; the student's own row is visible via existing `user_id = auth.uid()` policies).
- Phone OTP login path is unchanged.

Confirm and I'll implement.