## Goal

Make Announcements, Calendar, and My CCAs default to "All Children (N)" view for multi-child parents, with bracket count, de-duped aggregation, latest-first sort, and per-child tagging on CCA cards.

## Scope (parent portal only)

- `src/pages/AnnouncementsPage.tsx`
- `src/pages/CalendarPage.tsx` (label only)
- `src/pages/ParentCcaPage.tsx`
- `src/hooks/useStudentCcaEnrollments.ts` (extend to accept multiple student IDs)
- `src/components/home/ChildSelectorDropdown.tsx` (extend with optional "All Children (N)" mode)

No DB / RLS / schema changes. No teacher-portal changes. Home page widgets untouched.

## Changes

### 1. ChildSelectorDropdown — add multi-child "All" mode

Add optional controlled props so pages can drive their own local scope without touching the global `StudentSelectionContext`:

- `scopeValue?: string` ("all" | studentId)
- `onScopeChange?: (v: string) => void`
- `showAllOption?: boolean` (default false → keeps current single-child behaviour)
- `showCount?: boolean` (default true when `showAllOption` is on)

When `showAllOption` is on and the parent has >1 child:
- Default trigger label: `All Children (N)` where N = `linkedStudents.length`.
- Specific child label keeps existing single-name format.
- Dropdown items: `All Children (N)` first, then each child.
- Single-child parents still get the existing read-only name pill (no dropdown).

Existing call sites (compact header variant) keep working unchanged because the new props are opt-in.

### 2. Calendar page — bracket count on "All Children"

The local `Select` already exists. Update the trigger to show `All Children (N)` instead of plain `All Children`, and prefix the item label the same way. No logic change — multi-child aggregation + de-dup already implemented in earlier work via `scopeStudentIds` / `scopeCampusCode`.

### 3. Announcements page — all-children default

- Add local `scope` state (`"all"` | studentId), default `"all"`. Hide the global `showChildSelector` and render `ChildSelectorDropdown` in `variant="bar"` with `showAllOption`, the same gold-gradient bar used on CCA / Calendar / Attendance.
- Resolve a `scopeCampusCode` the same way Calendar does:
  - All scope: if every linked child shares one campus → use it; otherwise pass `null` (so multi-campus parents see both).
  - Specific child: that child's `campus_code`.
- Call `listAnnouncements({ limit, studentId: scope === "all" ? null : scope, campusCode: scopeCampusCode })`. `listAnnouncements` already orders by `created_at DESC` so "latest first" is preserved; keep the existing `sortOrder` chip default of `newest`.
- Since announcements are not per-student (school + campus scoped), de-duplication is naturally handled by the single DB query — no client-side dedupe needed.
- Single-child parents: behaviour unchanged (no "All" option shown).

### 4. My CCAs page — all-children default + per-child tag

Hook (`useStudentCcaEnrollments`):
- Accept `studentId: string | string[] | null`. Normalise to an ID array; when empty, return `[]`.
- Replace `.eq("student_id", studentId)` with `.in("student_id", ids)` and select `student_id` as well so we can map back to a child.
- Fetch linked-student names once (lightweight: caller passes a `studentNameById` map, or the hook fetches names via `students` table keyed on the IDs) so each enrollment row can carry `enrolledStudents: { id; name }[]`.
- De-dup by `activityId`: if two children are in the same activity, merge into one entry whose `enrolledStudents` array contains both names.
- Keep existing sort: soonest `nextSessionDate` first (latest upcoming), then by name — which matches the user's "sort by latest upcoming CCA" requirement.

Page (`ParentCcaPage`):
- Add local `scope` state (`"all"` | studentId), default `"all"` for multi-child, otherwise the single child.
- Use `ChildSelectorDropdown` with `showAllOption` + `showCount` in the existing gold-gradient bar.
- Pass `studentId={scope === "all" ? linkedStudents.map(s => s.id) : scope}` to the hook.
- On each card, when scope is `all` AND the activity has `enrolledStudents`, render a small child-name chip row under the title:
  - 1 child: a single muted pill `<UsersIcon/> {firstName}`.
  - 2+ children: comma-separated first names, truncating to 2 with `+N` overflow if needed.
- When scope is a specific child, hide the child chip (it's implicit).
- Empty state copy: `"None of your children are enrolled in any CCAs yet."` in all-mode; existing per-child copy otherwise.

## Out of scope

- No changes to `useStudentSelection` global context, home page, attendance page, or teacher screens.
- No changes to CCA details / sessions / enrollment mutation flows.
- Announcement read-state remains per-user (already correct for all-children mode).