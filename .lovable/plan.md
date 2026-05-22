
## Parent / Student CCA pages

Adds a read-only parent-side mirror of the teacher CCA experience: a list of the selected child's enrolled CCAs, plus a tabbed detail page. Built by reusing existing components (`OverviewPanel`, `SchedulePanel`, `VenuePanel`, `SessionNotesSheet`) in read-only mode and a new child-scoped attendance panel.

### Tabs (parent view)

Per request — no Members tab.

- **Overview** — same content as teacher Overview (description, schedule, venue, capacity, PIC, contact, requirements). Internal notes hidden.
- **Schedule** — same `SchedulePanel` but read-only: no "Add session", no edit/cancel actions, sessions remain tappable to open `SessionNotesSheet` in read-only mode (view title/notes/images/PDFs only, no edit/save/upload/delete).
- **Attendance** — per-session list scoped to the currently selected child only. Each row shows session date · time · venue · the child's status pill (Present / Absent / Late / Excused / —). Read-only.
- **Venue** — same `VenuePanel` as teacher.

Hero image, header chips (bucket pill, type name), and pull-to-refresh behave the same. PIC badge / "View only" badge replaced by a simple "Enrolled" pill when applicable.

### Routes & entry points

New routes under existing `ParentStudentGuard`:

- `/parent/cca` — list of the selected child's enrolled CCAs (cards).
- `/parent/cca/:activityId` — detail page.

Entry points:

1. **Bottom nav / list page** — add a "CCAs" tab (or, if bottom-nav slots are full, surface via Home quick-action and Calendar). Default plan: add to a parent "More" surface and link from Home + Calendar; bottom-nav stays as today to avoid crowding. (Confirm before shipping if you want it in the bottom bar.)
2. **Home** — the existing `useUpcomingCcaSessions` widget rows on `HomePage.tsx` become tappable and deep-link to `/parent/cca/:activityId`.
3. **Calendar** — `CcaDetailsSheet` (used in `src/pages/CalendarPage.tsx`) gets a "View full details" button that navigates to `/parent/cca/:activityId` and closes the sheet.

### Files

**New**
- `src/pages/ParentCcaPage.tsx` — list of enrolled CCAs for `selectedStudentId` (uses `useStudentCcaEnrollments`). Reuses `CcaActivityCard` in a read-only variant.
- `src/pages/ParentCcaDetailPage.tsx` — tabbed shell mirroring `TeacherCcaDetailPage` but with `tabs = [overview, schedule, attendance, venue]`, no edit affordances, wraps in `AppLayout` (parent layout) instead of `TeacherAppLayout`.
- `src/components/cca/ParentAttendancePanel.tsx` — fetches `cca_attendance` rows for `activityId + studentId` joined to sessions; renders a sorted list (most recent first) with status pills. Empty state when no sessions yet.

**Edited**
- `src/App.tsx` — register the two new routes inside the `ParentStudentGuard` block.
- `src/pages/HomePage.tsx` — wrap upcoming CCA rows in a `Link` to `/parent/cca/:activityId`.
- `src/pages/CalendarPage.tsx` + `src/components/cca/CcaDetailsSheet.tsx` — add an optional `onViewFullDetails` action to the sheet; CalendarPage passes a handler that navigates to the detail route.
- `src/components/cca/SessionNotesSheet.tsx` — accept a `readOnly` prop; when true, hide edit controls, save button, image upload, image delete, and PDF delete (view + open only).
- `src/components/cca/SchedulePanel` (currently inside `TeacherCcaDetailPage.tsx`) — extract to `src/components/cca/SchedulePanel.tsx` and accept a `canEdit` prop so it can be reused by the parent page in read-only mode. Teacher page imports the extracted module.

### Permissions & data

- All reads use existing tables (`cca_activities`, `cca_activity_teachers`, `cca_sessions`, `cca_session_attachments`, `cca_attendance`, `student_cca_enrollments`). Existing parent RLS already covers these (per `mem://security/cca-enrollment-rls`, `mem://features/parent-cca-read-only-access`, and the `get_teacher_public_info` RPC). No migration needed.
- The parent detail page must verify the selected child is actually enrolled in the activity before rendering content; if not, show "Not enrolled" empty state and a back link.
- Attendance query filters strictly on `student_id = selectedStudentId` AND `cca_activity_id = activityId` (or via the session join). No cross-child leakage.
- Uses `StudentSelectionContext` for the active child; switching the child on the detail page refetches attendance and the enrolled check.

### Mobile-app sibling impact

Read-only, additive — no schema or RLS changes. Safe for the shared Supabase backend; the sibling mobile app is unaffected.

### Out of scope

- No Members tab, no enrollment management, no editing, no uploads.
- Bottom-nav slot reshuffle (will confirm separately if you want CCA promoted there).
