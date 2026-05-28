# Event Detail — Notes Tab + Inline Editable Event Date

Mirror the web `collinz-app` changes on this mobile app. Applies only when `activity.kind === "event"`. Clubs and Outdoor are unchanged.

## 1. New data layer

**`src/hooks/useCcaActivityAttachments.ts`** (new)
- Reads/writes `cca_activity_attachments` filtered by `activity_id`, ordered by `created_at desc`.
- Returns `{ items, loading, uploading, uploadFiles, deleteAttachment, openAttachment, refetch }`.
- Upload:
  - Accept `image/png, image/jpeg, image/webp, image/gif, application/pdf`, max 10 MB.
  - Storage path: `activity/<activity_id>/<timestamp>-<sanitized-name>` in existing private bucket `cca-session-attachments`.
  - Insert row: `{ activity_id, file_name, storage_path, file_type, file_size, uploaded_by: auth user }`. `file_url` left null (signed URLs computed on demand).
- `openAttachment(item)`: `supabase.storage.from('cca-session-attachments').createSignedUrl(item.storage_path, 600)`, then open via `window.open` (web) or `@capacitor/browser` if native.
- Delete: remove storage object first, then `delete()` the row. Toast on each failure path.

**`src/hooks/useCcaActivityNotes.ts`** (new, small)
- `saveNotes(activityId, body)` → `update cca_activities set public_description = body`.
- Returns `{ saving, saveNotes }`. Toasts on RLS denial.

No migrations needed (table/bucket already provisioned per prompt).

## 2. Teacher detail (`src/pages/teacher/TeacherCcaDetailPage.tsx`)

**Tabs:** when `isEvent`, replace `{ id: "schedule", label: "Schedule" }` with `{ id: "notes", label: "Notes" }`. Default tab stays `overview`. Clubs/Outdoor unchanged.

**Overview (event-only block):** in `OverviewPanel`, insert an `EventDateRow` above the green info card:
- Pulls `sessionsHook.sessions` for the activity (filter `!isCancelled`). Expected count = 1.
- Renders a single InfoRow-style card with date / time / location.
- Empty state: "No date set yet" + `Set date` button (PIC/admin only).
- Populated: shows the date row + `Edit` and `Remove` icon buttons (PIC/admin only).
- If `>1` non-cancelled session exists, render a non-blocking amber banner: "Multiple dates found for this event. Only the earliest is shown — please clean up extras."
- Actions open the existing `SessionFormDialog` / `AlertDialog` delete confirm, calling `createSession` / `updateSession` / `deleteSession` from `useCcaSessions`. `createSession` passes `session_type: "event"` (extend `CcaSessionFormData` + `createSession` insert payload to forward an optional `sessionType`).
- Because `OverviewPanel` currently receives only `activity`, lift it: pass `sessionsHook`, `canEdit`, and a callback so it can mount the dialog. Keep the panel exported for parent reuse — extend the parent signature too.

**Notes tab (`EventNotesTab`, new local component):**
- Textarea bound to `activity.publicDescription`, save button (disabled until dirty). PICs/admins can edit; others see read-only multi-line text (`whitespace-pre-wrap`).
- Below: attachment grid.
  - Image tiles render the signed-URL thumbnail; PDF tiles render a generic PDF icon + filename.
  - Tap opens via signed URL.
  - PIC/admin: long-press / overflow icon → delete (confirm dialog).
  - Add button (PIC/admin) opens a hidden `<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf">`. Client-side validates type + ≤10 MB before upload.

**Hide for events:**
- Don't render the schedule FAB; don't render Schedule pill; don't render `SchedulePanel`.

## 3. Parent detail (`src/pages/ParentCcaDetailPage.tsx`)

- Mirror the same `isEvent` branch:
  - Tabs become `Overview | Notes | Attendance | Venue` for events.
  - `OverviewPanel` shows the same read-only `EventDateRow` (no edit buttons; parent never edits).
  - `EventNotesTab` rendered read-only: shows `publicDescription` text + tap-to-open attachment grid. No upload/delete UI.
- Clubs/Outdoor unchanged.

## 4. Reused / unchanged

- `useCcaSessions` (extended with optional `sessionType` field — backward compatible for clubs/outdoor where it stays null).
- `SessionFormDialog`, `AlertDialog`, `useCcaActivityById` (already returns `publicDescription`).
- RLS for `cca_activity_attachments` already enforced server-side per prompt.

## Technical notes

- **`SessionFormDialog` for events:** form already supports date/time/location/customTitle. For events we may want to hide the `customTitle` field (event uses parent name) — pass a new `mode="event"` prop that suppresses the title input and the requirements field. Cosmetic-only.
- **Signed URL caching:** keep a small in-memory `Map<storage_path, { url, expiresAt }>` in the hook so re-rendering the grid doesn't refetch every image. Refresh at ~8 min.
- **Optimistic UI:** after upload, append placeholder then refetch; after delete, optimistically remove then refetch on failure.
- **Empty/loading states:** skeleton row in the Overview date card while sessions load; skeleton tiles in Notes attachment grid.
- **Permissions source of truth:** `useCcaActivityPermissions(activity).canEdit` — same gate used by Schedule.
- **No migrations.** No edge functions. No bucket changes.

## Files

Created:
- `src/hooks/useCcaActivityAttachments.ts`
- `src/hooks/useCcaActivityNotes.ts`

Edited:
- `src/hooks/useCcaSessions.ts` (add optional `sessionType` to form data + insert/update)
- `src/components/cca/SessionFormDialog.tsx` (optional `mode="event"` to hide custom title/requirements)
- `src/pages/teacher/TeacherCcaDetailPage.tsx` (tab swap, OverviewPanel event-date block, EventNotesTab component, omit schedule FAB for events)
- `src/pages/ParentCcaDetailPage.tsx` (tab swap, read-only event date in overview, read-only EventNotesTab)
