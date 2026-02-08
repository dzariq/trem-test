
# Plan: Add Homework Page and Swap Navigation Items

## Summary
Reorganize the parent app navigation to add a new Homework tab in the bottom navigation, move Support to QuickLinks, and create a homework viewing page for parents to see homework assigned to their children.

---

## Changes Overview

| Current Location | New Location |
|-----------------|--------------|
| Bottom Nav: Support | Bottom Nav: **Homework** |
| QuickLinks: Student Awards (Trophy) | QuickLinks: **Support** (HeadphonesIcon) |
| N/A | New: `/parent/homework` page |

---

## Implementation Details

### 1. Update Bottom Navigation

**File:** `src/components/layout/BottomNavigation.tsx`

Replace the Support tab with Homework:
- Change icon from `HeadphonesIcon` to `BookOpen` (or similar homework icon)
- Change path from `/parent/support` to `/parent/homework`
- Change label from "Support" to "Homework"

```tsx
const navItems: NavItem[] = [
  { to: "/parent", icon: Home, label: "Home" },
  { to: "/parent/attendance", icon: UserCheck, label: "Attendance" },
  { to: "/parent/academic", customIcon: academicOwlIcon, label: "Academic" },
  { to: "/parent/calendar", icon: Calendar, label: "Calendar" },
  { to: "/parent/homework", icon: BookOpen, label: "Homework" },  // Changed
];
```

---

### 2. Update QuickLinks

**File:** `src/components/home/QuickLinks.tsx`

Replace "Student Awards" (Trophy) with "Support" (HeadphonesIcon):
- Keep the awards available via "Awards" link which already goes to Academic tab
- Add Support with blue theme matching its importance

```tsx
const quickLinks = [
  { icon: Info, label: "Info", action: "info-dialog", bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { icon: HeadphonesIcon, label: "Support", path: "/parent/support", bgColor: "bg-blue-100", iconColor: "text-blue-600" },  // Changed
  { icon: Award, label: "Awards", path: "/parent/academic?tab=cocurriculum", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { icon: Dumbbell, label: "CCA Activities", path: "/parent/calendar?tab=cca", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { icon: BarChart3, label: "Grade Analysis", path: "/parent/academic?section=analysis", bgColor: "bg-rose-100", iconColor: "text-rose-600" },
];
```

---

### 3. Create Homework Page

**File:** `src/pages/HomeworkPage.tsx` (new file)

A page that displays homework assignments for the selected student. Features:

**Data Source:**
- Query `lesson_plan_details` for homework entries
- Join through `lesson_weeks` -> `lesson_topics` -> `lesson_plans`
- Filter by `lesson_plans.class` matching the student's class
- Order by date (most recent first)

**UI Structure:**
```
┌────────────────────────────────────────────┐
│ 📚 Homework                                │
│ [Student Selector Dropdown]                │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 📘 Mathematics              Feb 5    │   │
│ │ Introduction to Triangles            │   │
│ │ Complete triangle classification     │   │
│ │ worksheet. Find and photograph 3...  │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 🔬 Science                  Feb 4    │   │
│ │ What is a Force?                     │   │
│ │ Draw 5 examples of forces at home    │   │
│ └──────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

**Components:**
- Header with title and child selector dropdown
- List of homework cards showing:
  - Subject name and icon
  - Lesson title
  - Assignment date
  - Homework description (expandable if long)
- Empty state when no homework is assigned

---

### 4. Create Homework Hook

**File:** `src/hooks/useStudentHomework.ts` (new file)

Hook to fetch homework for a student based on their class:

```tsx
export function useStudentHomework(studentId: string | null) {
  // 1. Get student's class from students table
  // 2. Query lesson_plan_details with homework via lesson_plans
  // 3. Filter by class match and future/recent dates
  // 4. Return sorted homework list
}
```

**Query Logic:**
```sql
SELECT 
  lpd.id,
  lpd.title,
  lpd.homework,
  lpd.date,
  lp.subject,
  lp.class,
  lp.year_level
FROM lesson_plan_details lpd
JOIN lesson_weeks lw ON lpd.week_id = lw.id
JOIN lesson_topics lt ON lw.topic_id = lt.id
JOIN lesson_plans lp ON lt.lesson_plan_id = lp.id
WHERE 
  lpd.homework IS NOT NULL 
  AND lpd.homework != ''
  AND lp.class = [student's class]
ORDER BY lpd.date DESC
```

---

### 5. Update App Routes

**File:** `src/App.tsx`

Add route for the new Homework page:

```tsx
import HomeworkPage from "./pages/HomeworkPage";

// Inside ParentStudentGuard routes
<Route path="/parent/homework" element={<HomeworkPage />} />
```

---

## Data Flow

```text
Parent Login
    │
    ▼
StudentSelectionContext (selectedStudentId)
    │
    ▼
useStudentHomework(studentId)
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 1. Fetch student's class from students table    │
│ 2. Fetch homework from lesson_plan_details      │
│    WHERE lesson_plans.class = student.class     │
│ 3. Filter recent/upcoming assignments           │
└─────────────────────────────────────────────────┘
    │
    ▼
HomeworkPage displays homework cards
```

---

## RLS Considerations

The homework query requires appropriate RLS policies:
- `students` table: Parents can read students linked via `student_guardians`
- `lesson_plan_details`, `lesson_weeks`, `lesson_topics`, `lesson_plans`: Need to verify parents can read these for their students' classes

If RLS blocks access, may need to add policies like:
```sql
CREATE POLICY "Parents can read homework for their children's classes"
ON lesson_plan_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN students s ON sg.student_id = s.id
    JOIN lesson_weeks lw ON lesson_plan_details.week_id = lw.id
    JOIN lesson_topics lt ON lw.topic_id = lt.id
    JOIN lesson_plans lp ON lt.lesson_plan_id = lp.id
    WHERE sg.guardian_user_id = auth.uid()
    AND s.class = lp.class
  )
);
```

---

## Visual Theme

Using a **sky blue** theme for Homework (consistent with existing homework styling in teacher app):
- Border: `border-sky-200`
- Background: `bg-sky-50/50`
- Icons: `text-sky-600`
- Subject badges: `bg-sky-100 text-sky-700`

---

## Files to Create

1. `src/pages/HomeworkPage.tsx` - Main homework viewing page
2. `src/hooks/useStudentHomework.ts` - Data fetching hook

## Files to Modify

1. `src/components/layout/BottomNavigation.tsx` - Replace Support with Homework
2. `src/components/home/QuickLinks.tsx` - Replace Student Awards with Support
3. `src/App.tsx` - Add /parent/homework route

## Database (if RLS blocks access)

- Add RLS policies for lesson plan tables to allow parent read access for their children's classes
