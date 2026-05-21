# My CCAs → Full-page Club Detail with Tabs

## Problems to fix
1. Tapping a CCA card on `/teacher/cca` opens a bottom sheet, **Manage Sessions** does nothing (no `onManageSessions` handler wired in `TeacherCcaPage.tsx`).
2. The drawer header ("CCA details" label) sits flush left with no padding.
3. The drawer is cramped — user wants a full page like the web dashboard with tabs for the important areas.

## Solution

Replace the bottom-sheet flow with a dedicated **full-page route** for each CCA, mobile-first, with a tab switcher.

### Routing
- New route: `/teacher/cca/:activityId` (inside `TeacherGuard` in `App.tsx`).
- `TeacherCcaPage.tsx`: change `onClick={() => setSelected(a)}` to `navigate(\`/teacher/cca/${a.id}\`)`. Remove the `<CcaDetailsSheet>` usage on this page.

### New page: `src/pages/teacher/TeacherCcaDetailPage.tsx`

Layout (390px-first):

```text
┌──────────────────────────────┐
│ ← Back            (header)   │
├──────────────────────────────┤
│  [Hero image — editable PIC] │
│  Art Club  [PIC] [Club pill] │
│  Wed · 15:30 · Art Room      │
├──────────────────────────────┤
│ ▸ Sticky tab bar (scrollable)│
│  Overview | Schedule |       │
│  Members | Attendance |      │
│  Venue   | Budget            │
├──────────────────────────────┤
│  <Tab content>               │
└──────────────────────────────┘
```

- Fetch the activity via existing `useTeacherInvolvedCcas(activeCampus)` and find by `:activityId`; while loading, render skeleton. If not found → empty state with "Back to My CCAs".
- Tab bar: horizontally scrollable pill tabs (same style as the filter tabs already on the list page), sticky under header.

### Tabs

| Tab | Content (mobile-first) | Source |
|---|---|---|
| **Overview** | Description, meeting day/time, location, capacity, PIC list, contact email, requirements, internal notes (PIC only). Reuse the body of the current `CcaDetailsSheet` (extract to `CcaOverviewPanel`). | Existing `activity` data |
| **Schedule** | Sessions list (active + cancelled) with add/edit/cancel/delete actions for PIC. Inline — no nested sheet. Reuse logic from `ManageSessionsSheet.tsx` (extract to `CcaSchedulePanel`). | `useCcaSessions` |
| **Members** | Enrolled student list with avatar, class, status. PIC actions later (read-only for now if no manage hook for clubs). | `useStudentCcaEnrollments` (already exists) |
| **Attendance** | Picker: pick a session → show `SessionAttendanceList` for marking. PIC-only. | `useCcaSessionAttendance` |
| **Venue** | Venue card (name + image if any) and `activity.location` text. Read-only. | `activity.venue` |
| **Budget** | Placeholder card "Coming soon — budget tracking will appear here." (no schema yet). | — |

For outdoor CCAs, replace **Members** with **Bus Attendance** (already used elsewhere via `BusAttendanceList`).

### Manage Sessions fix
- The button in `CcaDetailsSheet` becomes unused on mobile (sheet is no longer the entry point from the My CCAs page). Keep the sheet as-is for other callers (parent app uses it). No behavior change there.
- In the new `CcaSchedulePanel`, the "+ Add Session" button is always visible at the top for PIC; non-PIC sees the list read-only with a small note.

### Padding fix
- New full-page layout already uses `px-4`. The legacy sheet's "CCA details" subtitle is unaffected by the new flow, but as a small polish add `px-4` to the BottomSheet header description in `CcaDetailsSheet.tsx` so other callers also look right.

### Permissions
- Reuse `useCcaActivityPermissions(activity)` → `canEdit` gates: image upload, session add/edit/delete, attendance marking.

## Files

**Create**
- `src/pages/teacher/TeacherCcaDetailPage.tsx` — full page shell + tab switcher
- `src/components/cca/panels/CcaOverviewPanel.tsx`
- `src/components/cca/panels/CcaSchedulePanel.tsx`
- `src/components/cca/panels/CcaMembersPanel.tsx`
- `src/components/cca/panels/CcaAttendancePanel.tsx`
- `src/components/cca/panels/CcaVenuePanel.tsx`
- `src/components/cca/panels/CcaBudgetPanel.tsx`

**Edit**
- `src/App.tsx` — add `/teacher/cca/:activityId` route
- `src/pages/teacher/TeacherCcaPage.tsx` — card click navigates; remove sheet
- `src/components/cca/CcaDetailsSheet.tsx` — small padding fix only

## Out of scope
- No DB schema or RLS changes.
- No edits to parent-app flows; the existing `CcaDetailsSheet` continues to work for parent.
- Budget tab is a placeholder until a schema is introduced.
