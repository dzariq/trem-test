

## Multi-Campus Support — Frontend Implementation Plan

This plan adds campus-aware data scoping for Teachers and Parents across the mobile app. No database changes. All campus filtering happens on the frontend via query parameters and state management.

---

### Architecture Overview

```text
┌─────────────────────────────────────────┐
│              App.tsx                     │
│  AuthProvider                           │
│    └─ CampusProvider  ← NEW            │
│        └─ StudentSelectionProvider      │
│            └─ Routes                    │
└─────────────────────────────────────────┘

Teacher flow:
  Login → fetch user_campuses → set activeCampus → persist to storage
  1 campus  → auto-set, no UI
  2 campuses → auto-set primary, show switcher in Profile

Parent flow:
  Login → select child → derive campus_code from child record
  No campus UI ever shown
```

---

### New Files to Create

**1. `src/contexts/CampusContext.tsx`** — Campus state provider

- Fetches `user_campuses` joined with `campuses` table on auth load
- For teachers: sets `activeCampus` to `is_primary=true` campus_code, persists to AsyncStorage/localStorage (using same Capacitor Preferences pattern as `useTeacherScope`)
- For parents: derives `activeCampus` from selected child's `campus_code` (reads from StudentSelectionContext)
- Exposes: `activeCampus`, `campuses` (array of {campus_code, name, is_primary}), `setActiveCampus`, `isMultiCampus` (boolean), `loading`
- On `setActiveCampus`: writes to storage + calls `queryClient.invalidateQueries()` to refresh everything
- On logout: clears stored campus from storage

**2. `src/components/campus/CampusBadge.tsx`** — Reusable badge component

- Props: `code: string`, optional `size`
- BO → blue `#1D4ED8`, GL → green `#15803D`, white text
- Used in header pill, profile page, and anywhere campus identity is shown

**3. `src/components/campus/CampusSwitcher.tsx`** — Segmented control for teachers

- Only renders if `isMultiCampus === true`
- Shows two options with campus names and colored badges
- On switch: calls `setActiveCampus` from context (which handles persistence + cache invalidation)

---

### Files to Modify

**4. `src/App.tsx`** — Wrap with CampusProvider

- Add `CampusProvider` between `AuthProvider` and `StudentSelectionProvider`

**5. `src/contexts/StudentSelectionContext.tsx`** — Add `campus_code` to LinkedStudent data

- The `listMyLinkedStudents` already fetches student records. Need to ensure `campus_code` is included in the select query in `src/data/students.ts`
- When child selection changes, the CampusContext will reactively derive the parent's active campus

**6. `src/data/students.ts`** — Include `campus_code` in student queries

- Add `campus_code` to the select in `listViaStudentGuardians` (line ~89: add to select string)
- Map `campus_code` onto `LinkedStudent` type

**7. `src/components/layout/AppHeader.tsx`** — Show campus pill for teachers

- If teacher and `isMultiCampus`, render small `CampusBadge` in header

**8. `src/pages/teacher/TeacherProfilePage.tsx`** — Add campus switcher section

- Import `CampusSwitcher` component
- Add "Active Campus" card section between Contact Info and Subjects cards
- Only shown when teacher has 2 campuses

**9. Teacher data-fetching files — Add `.eq('campus_code', activeCampus)` filter:**

These files contain direct Supabase queries that need campus scoping:

| File | Tables affected | Change |
|------|----------------|--------|
| `src/data/announcements.ts` | `announcements` | Add `campus_code` filter to `listAnnouncements` query |
| `src/data/calendar.ts` | `calendar_events` | Add `campus_code` filter to `listCalendarEvents` and `listUpcomingEvents` |
| `src/data/teacherAttendance.ts` | `attendance`, `students` | Add `campus_code` filter to all queries + stamp on insert |
| `src/hooks/useTeacherScope.ts` | `class_years` | Add `campus_code` filter to class_years fetch |
| `src/hooks/useTeacherLessonPlans.ts` | `lesson_plans`, `homework_assignments` | Add `campus_code` filter to reads + stamp on inserts |
| `src/hooks/useHomeworkTracking.ts` | `homework_assignments` | Add `campus_code` filter |
| `src/pages/teacher/TeacherHomePage.tsx` | `students`, `attendance` | Add `campus_code` to inline queries |
| `src/pages/SupportPage.tsx` | `parent_tickets` | Stamp `campus_code` on insert |

**Approach for each:** Accept `campusCode` as a parameter (or read from context via a hook), append `.eq('campus_code', campusCode)` to select queries, and include `campus_code: activeCampus` on all inserts.

**10. Parent data-fetching** — Scope queries by child's campus

For parent pages, the campus_code is derived from `selectedChild.campus_code`. The same data files above (announcements, calendar, attendance) will accept an optional `campusCode` parameter. Parent page components will pass the derived campus code.

**11. `src/contexts/AuthContext.tsx`** — Clear campus on sign out

- Add campus storage key clearing in the `signOut` function

---

### Edge Cases Handled

- **activeCampus null during load**: CampusContext exposes `loading` state; consuming components show skeleton/loading UI rather than empty lists
- **Missing campus_code on child**: `LinkedStudent.campus_code` defaults to null; CampusContext shows fallback message
- **RLS rejection**: Existing error handling in data files already shows toast errors; no additional changes needed
- **Logout**: Both localStorage and Capacitor Preferences are cleared
- **No hardcoded campus codes**: All BO/GL references are only in the CampusBadge color mapping; all query logic reads from state

---

### Implementation Order

1. Create `CampusContext` + `CampusBadge` + `CampusSwitcher` (foundational)
2. Wire into `App.tsx` and update `students.ts` to include `campus_code`
3. Add campus filter to `useTeacherScope` (class_years) — this cascades to all teacher views
4. Add campus filter to remaining data files (announcements, calendar, attendance, lesson plans, homework, tickets)
5. Add campus switcher UI to TeacherProfilePage + header pill
6. Parent: derive campus from selected child, pass to data queries

