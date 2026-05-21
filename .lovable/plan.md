# Teacher nav refactor + My CCAs module

## 1. Bottom nav: collapse to 5 tabs with a "More" sheet

New `TeacherBottomNavigation` layout (left → right):

```text
[ Home ] [ Attend ] [ Academic ] [ Calendar ] [ More ☰ ]
```

- "Lesson" and "My CCAs" move OUT of the bottom bar and INTO a "More" sheet (rightmost hamburger).
- "More" opens a bottom sheet (`@/components/ui/bottom-sheet`) at 75vh per the standardized draggable-bottom-sheet rule, with a grid of large tap targets:
  - Lesson Plans → `/teacher/lesson-plans`
  - My CCAs → `/teacher/cca` (new)
  - Handbook → `/teacher/handbook`
  - DNA → `/teacher/dna`
  - Timetable → `/teacher/timetable`
  - Announcements → `/teacher/announcements`
- "More" tab shows an active state while the user is on any route listed inside it.
- Icon: `Menu` from lucide-react. Sheet uses `z-[100]` and the safe-area bottom rule.

## 2. New route: `/teacher/cca` — "My CCAs"

Add route inside `<TeacherGuard>` in `src/App.tsx`, lazy or direct import of a new `src/pages/teacher/TeacherCcaPage.tsx`.

### Visibility rule (teacher-only "My CCAs")

A CCA shows up only if the logged-in teacher is **involved**. Involvement = ANY of:

1. Listed as PIC on `cca_activity_teachers` for the activity (`teacher_user_id = auth.uid()`), OR
2. Listed on a bus for the activity as `cca_outdoor_buses.teacher_pic_main` or `teacher_pic_sub` (covers outdoor CCAs where teacher is bus PIC only).

Principals/admins are NOT auto-included here — this page is "**my** CCAs", not "all CCAs". They can still see the existing `useCcaActivityFilter` pages.

Scoped to current campus via `CampusContext` (`campus_code` filter) to stay consistent with other teacher pages.

### Page structure (mobile-first, 390px viewport)

```text
─────────────────────────────
 AppHeader: "My CCAs"
─────────────────────────────
 Segmented tabs (sticky):
  [ All ] [ Clubs ] [ Outdoor ] [ Events ]
─────────────────────────────
 CCA cards (vertical stack):
  ┌───────────────────────────┐
  │  hero image (16:9)         │
  │  ── gradient overlay ──   │
  │  TYPE PILL · role chip    │
  ├───────────────────────────┤
  │  Activity name (lg, bold) │
  │  Next session · Sat 23 May│
  │  9:00 AM – 10:30 AM       │
  │  Venue · 18/25 enrolled   │
  │  ──────────────────────   │
  │  Primary action (varies)  │
  └───────────────────────────┘
```

Role chip on each card (so teacher knows why they see it):
- "PIC" (purple) if activity PIC
- "Bus PIC" (amber) if only bus PIC
- "Co-PIC" if `is_primary = false`

Primary action per kind:
- **Outdoor** → "Take Bus Attendance" → opens bus list sheet → session attendance flow (reuses `BusAttendanceList` + `SessionAttendanceList`)
- **Club** → "Manage" → opens existing `ManageStudentsSheet` / `ManageSessionsSheet`
- **Event** → "View Event" → opens `EventDetailsSheet`

Empty state: friendly illustration + "You're not assigned to any CCAs yet. Ask the CCA coordinator to add you as a PIC."

Loading: 3 skeleton cards.

### Data hooks

New `src/hooks/useTeacherInvolvedCcas.ts`:
- Query `cca_activity_teachers` where `teacher_user_id = uid` → activityIds set A.
- Query `cca_outdoor_buses` where `teacher_pic_main = uid OR teacher_pic_sub = uid` → activityIds set B.
- Union, then fetch full activity rows (reuse the shape from `useEligibleCcaActivities` — name, image, venue, sessions, picTeachers, kind, type) filtered by `campus_code`.
- Returns `{ activities, loading, error, refetch, filterByKind }` plus a per-activity `myRole: "pic" | "co-pic" | "bus-pic"`.

No DB migration required — existing RLS already lets teachers SELECT their own `cca_activity_teachers` and outdoor buses.

## 3. Design system

- Reuse `CcaActivityCard` styling (hero image + gradient overlay + type-color mapping per memory).
- Card radius, paddings, and shadows match existing CCA list pages.
- Tabs styled like Calendar's non-sticky tabs but **sticky here** (top, under header) since this page is a single scrollable list.
- All colors via semantic tokens.

## Files

Created:
- `src/pages/teacher/TeacherCcaPage.tsx`
- `src/hooks/useTeacherInvolvedCcas.ts`
- `src/components/layout/TeacherMoreSheet.tsx`

Edited:
- `src/components/layout/TeacherBottomNavigation.tsx` (5 tabs, More button + sheet state)
- `src/App.tsx` (add `/teacher/cca` route)

## Out of scope

- No changes to parent CCA flows.
- No changes to existing principal/admin CCA list pages.
- No DB migrations or RLS edits (shared Supabase backend — mobile app unaffected).
