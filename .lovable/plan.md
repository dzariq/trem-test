
# Plan: Redesign Teacher Lesson Plans with Color Themes and Homework Tab

## Summary
This plan addresses four key improvements for the teacher lesson plans module:
1. Fix sharp highlight edges on tabs to match rounded corners
2. Apply green color theme for Content tab
3. Apply yellow color theme for Reflections tab
4. Add a new Homework tab for assigning homework to students
5. Auto-navigate to today's lesson based on date

---

## Current State Analysis

**TeacherMLPDetailPage.tsx** (Mobile Lesson Plan Detail):
- Uses `Tabs` with Content and Reflections tabs
- Current tabs have gray styling with square highlights (`rounded-none`)
- No color differentiation between tabs

**Design Issues Found:**
- `TabsList` uses `rounded-none` causing sharp edges
- `TabsTrigger` defaults to gray background, no color theming
- No visual distinction between Content (green) and Reflections (yellow) tabs

---

## Design Changes

### Color Theme System

| Tab | Primary Color | Background | Border | Icon Color |
|-----|---------------|------------|--------|------------|
| **Content** | Green (primary) | `bg-primary/10` | `border-primary/30` | `text-primary` |
| **Reflections** | Yellow (amber) | `bg-amber-50` | `border-amber-200` | `text-amber-600` |
| **Homework** | Blue (sky) | `bg-sky-50` | `border-sky-200` | `text-sky-600` |

### Tab Styling
- Change `rounded-none` to `rounded-lg` on TabsList
- Apply themed backgrounds when tabs are active
- Match highlight color to active tab's theme

---

## Implementation Details

### File 1: `src/pages/teacher/TeacherMLPDetailPage.tsx`

**Tab Structure Updates:**
- Add third tab for "Homework" with a `ClipboardList` icon
- Change TabsList from `rounded-none` to `rounded-lg`
- Apply color themes to each TabsTrigger:
  - Content: green theme when active
  - Reflections: yellow/amber theme when active
  - Homework: blue theme when active

**Auto-Open Today's Lesson:**
- Add `useEffect` to check lesson dates against current date
- When topics/weeks load, find the lesson matching today's date
- Auto-expand that topic and week, pre-select the lesson

**Homework Tab Content:**
- Mirror the Content tab structure (topics > weeks > lessons)
- Each lesson shows homework text from the lesson_plan_details table
- Teachers can assign/edit homework text with a save button
- Display "No homework assigned" when empty

```tsx
// Tab color configuration
const tabThemes = {
  content: {
    active: "bg-primary/20 text-primary border-primary/30",
    icon: "text-primary",
  },
  reflections: {
    active: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-600",
  },
  homework: {
    active: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "text-sky-600",
  },
};
```

### File 2: `src/components/lessonplan/TeacherLessonReflectionForm.tsx`

**Yellow Theme Enhancement:**
- Currently uses emerald (green) for reflected and amber (yellow) for not reflected
- Flip this: use amber/yellow as the primary theme color for all reflection cards
- Use subtle green accent only for the "Reflected" status badge
- Keep the yellow theme consistent throughout the form

### File 3: `src/components/lessonplan/ReadOnlyLessonContent.tsx`

**Green Theme Enhancement:**
- Add subtle green background tint to Cards (`bg-primary/5`)
- Icon colors already use `text-primary` (green) - keep this
- Add green border accent to cards (`border-primary/20`)

### File 4: New Component - `src/components/lessonplan/TeacherHomeworkForm.tsx`

**New Component for Homework Tab:**
- Similar structure to TeacherLessonReflectionForm
- Blue color theme (sky colors)
- Fields:
  - Homework assignment (textarea)
  - Due date (optional date picker)
  - Save button
- Fetches/saves to existing `homework` field in lesson_plan_details

### File 5: `src/hooks/useTeacherLessonPlans.ts`

**Add Homework Management:**
- Add `useHomeworkManagement` hook or extend existing hooks
- Functions to:
  - Fetch homework for lessons
  - Save/update homework text
- Similar pattern to `useLessonReflections`

---

## Auto-Navigate to Today's Lesson

Logic to add in TeacherMLPDetailPage:
1. When lessons are loaded, find lesson with date matching today
2. Get the week and topic containing that lesson
3. Auto-expand the topic and week
4. Pre-select the lesson

```typescript
useEffect(() => {
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Find lesson matching today's date
  for (const topic of topics) {
    const weeks = getWeeksForTopic(topic.id);
    for (const week of weeks) {
      if (!isLessonsLoaded(week.id)) continue;
      const lessons = getLessonsForWeek(week.id);
      const todayLesson = lessons.find(l => l.date === today);
      if (todayLesson) {
        setExpandedTopics(new Set([topic.id]));
        setExpandedWeeks(new Set([week.id]));
        setSelectedLessonId(todayLesson.id);
        return;
      }
    }
  }
}, [topics, /* dependencies */]);
```

---

## Visual Outcome

**Before:**
- Gray tabs with sharp edges
- No color differentiation
- No homework assignment tab

**After:**
- Rounded tabs with smooth transitions
- Content tab: Green theme (consistent with app branding)
- Reflections tab: Yellow theme (warm, reflective feel)
- Homework tab: Blue theme (task-oriented feel)
- Auto-opens to today's lesson for convenience

---

## Technical Details

### Component Dependencies
- Lucide icons: `ClipboardList` for Homework tab
- No new packages required

### Database
- Homework data already exists in `lesson_plan_details.homework` field
- No schema changes needed

### Files to Modify
1. `src/pages/teacher/TeacherMLPDetailPage.tsx` - Main tab restructure, add Homework tab
2. `src/components/lessonplan/TeacherLessonReflectionForm.tsx` - Yellow theme
3. `src/components/lessonplan/ReadOnlyLessonContent.tsx` - Green theme enhancement
4. `src/hooks/useTeacherLessonPlans.ts` - Add homework save/load functions

### Files to Create
1. `src/components/lessonplan/TeacherHomeworkForm.tsx` - New homework form component

---

## Summary of Changes

| Change | Description |
|--------|-------------|
| Fix tab corners | Change `rounded-none` to `rounded-lg` on TabsList |
| Green theme (Content) | Apply `bg-primary/10` active state, green icons |
| Yellow theme (Reflections) | Apply `bg-amber-100` active state, amber icons |
| Blue theme (Homework) | New tab with `bg-sky-100` active state |
| Homework tab | New functionality to assign homework per lesson |
| Auto-open today | Navigate to today's lesson on page load |
