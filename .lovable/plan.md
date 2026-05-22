## Goal

Promote **Schedule** to a top-level tab on the teacher CCA detail page. Each date in the schedule opens a session-notes view where PICs can edit a session title, remarks/notes, attach images, and attach PDFs. Parents/teachers without edit rights see the same view in read-only mode.

## Tab changes (`TeacherCcaDetailPage.tsx`)

Add `Schedule` between `Overview` and `Members/Attendance`:

- Clubs/Events: `Overview · Schedule · Members · Attendance · Venue`
- Outdoor:     `Overview · Schedule · Sports · Venue · Buses`

Remove the inline `<SchedulePanel />` block currently rendered under Overview (Overview keeps description, schedule summary card, PIC list, etc., but the dedicated session list moves out).

## Schedule tab UX

A new `ScheduleTab` panel renders the existing session cards from `useCcaSessions`. Behaviour:

- Each session card becomes tappable; tapping opens a **Session Notes** sheet (bottom sheet, 75vh standard, `z-[100]`).
- PIC-only `+ Add session` button stays at top-right (reuses `SessionFormDialog` for date/time/location creation).
- Past sessions stay collapsed under a "Past sessions" group; upcoming first.

### Session Notes sheet

Header: session date + optional custom title chip. PIC sees a small `Edit` pencil; everyone sees the content.

Sections (all optional):

1. **Title** – text input, maps to `cca_sessions.custom_title`.
2. **Remarks / Notes** – multiline textarea, maps to `cca_sessions.description`.
3. **Requirements** – existing textarea, maps to `cca_sessions.requirements` (kept for parity).
4. **Images** – grid of thumbnails with add/delete. Stored in Supabase Storage bucket `cca-session-attachments`, indexed by a new `cca_session_attachments` table (`kind = 'image'`). Tap thumbnail = lightbox.
5. **PDF attachments** – list of file rows with name + size + open/delete. Same bucket + table (`kind = 'pdf'`). Tap = open via existing PDF viewer pattern.

Edit mode toggles inline; Save writes via `useCcaSessions.updateSession` for title/description/requirements, and via a new `useCcaSessionAttachments` hook for file ops. Read-only mode hides inputs and delete buttons.

## Backend changes

New table `public.cca_session_attachments`:

- `session_id uuid` → `cca_sessions(id)` on delete cascade
- `kind text check (kind in ('image','pdf'))`
- `storage_path text` (path inside the bucket)
- `file_name text`
- `mime_type text`
- `size_bytes bigint`
- `uploaded_by uuid` → `auth.users(id)`
- standard `id`, `created_at`

RLS:

- **Select**: anyone who can view the parent activity (mirrors `cca_sessions` select policy — principal/admin, activity PIC, year-overlap teacher, enrolled student's parent).
- **Insert / Delete**: only `is_admin_like()` or users in `cca_activity_teachers` for the parent activity (same rule used for editing sessions).
- **Update**: not needed (files are immutable; users delete + re-upload).

New Storage bucket `cca-session-attachments` (private), with policies that mirror the table RLS using the first path segment = `activity_id`.

## Frontend technical detail

New files:

- `src/hooks/useCcaSessionAttachments.ts` – fetch/list, upload (image/pdf), delete; returns `images`, `pdfs`, `uploading`, action helpers. Generates signed URLs for display.
- `src/components/cca/SessionNotesSheet.tsx` – the bottom sheet described above (uses existing `bottom-sheet` primitive, follows the standardized draggable 75vh + `h-[100dvh]` pattern from memory).
- `src/components/cca/ScheduleTab.tsx` – list + add button + opens `SessionNotesSheet`.

Edits:

- `TeacherCcaDetailPage.tsx` – add `schedule` to `tabs`, remove the inline Schedule block from Overview, render `<ScheduleTab />` when `tab === 'schedule'`. Reuse the existing hoisted `sessionsHook`.
- `src/components/cca/SessionFormDialog.tsx` – unchanged (still used for creating the calendar entry; attachments live in the new sheet).

Parent CCA detail (`ParentCcaDetailPage`, if applicable) is read-only by existing rules — same `ScheduleTab` works because edit affordances key off `canEdit`.

## Out of scope

- No changes to attendance flow.
- No new notification types (existing session-create trigger still fires).
- PDF preview uses existing `PDFViewerDialog`; we don't build a new viewer.
