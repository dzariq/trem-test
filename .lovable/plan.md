
# Homework Sub-Tabs Implementation Plan

## Overview
Add a nested tab switcher inside the Homework tab with two sub-tabs:
1. **Assign** - For assigning homework to students (current functionality)
2. **Track** - For tracking which students have submitted their homework

## Current State Analysis
- Homework is stored in `lesson_plan_details.homework` as a text field
- Students are linked to classes via `students.class` (text) and `students.class_year_id` (integer FK)
- The `class_years` table maps class IDs to class names
- No existing homework submission tracking table exists in the database

## Architecture Design

### Database Changes
A new table `homework_submissions` will be created to track student homework submission status:

```text
homework_submissions
+------------------------+----------+-------------------------------------------+
| Column                 | Type     | Description                               |
+------------------------+----------+-------------------------------------------+
| id                     | uuid     | Primary key                               |
| lesson_plan_detail_id  | uuid     | FK to lesson_plan_details                 |
| class_year_id          | integer  | FK to class_years                         |
| student_id             | uuid     | FK to students                            |
| submitted              | boolean  | Whether homework was submitted            |
| submitted_at           | timestamp| When status was last updated              |
| marked_by              | uuid     | Teacher who marked the status             |
| notes                  | text     | Optional teacher notes                    |
| created_at             | timestamp| Record creation time                      |
| updated_at             | timestamp| Last update time                          |
+------------------------+----------+-------------------------------------------+
```

### UI Changes

#### 1. Homework Tab Sub-Navigation
Inside the existing Homework tab, add a secondary pill-style tab switcher:
- **Assign** (default) - Shows current homework assignment interface
- **Track** - Shows homework submission tracking interface

The sub-tabs will use the same styling as the main tabs (rounded-xl, light background) but smaller.

#### 2. Assign Sub-Tab
- Contains the existing `TeacherHomeworkForm` component (no changes needed)
- Shows all lessons organized by Topic > Week structure

#### 3. Track Sub-Tab
- Filters to show **only lessons with assigned homework**
- For each lesson with homework:
  - Shows lesson title and homework text preview
  - Lists all students in the selected class
  - Each student row has a checkbox to mark submission status
  - Optional notes field per student
  - Visual indicators for submission progress (e.g., "15/22 submitted")

### Component Structure

```text
TeacherMLPDetailPage.tsx
  |
  +-- Homework Tab
        |
        +-- HomeworkSubTabs (new component)
              |
              +-- Assign Tab
              |     +-- TeacherHomeworkForm (existing)
              |
              +-- Track Tab
                    +-- HomeworkTrackingView (new component)
                          +-- HomeworkTrackingCard (new component)
                                +-- StudentSubmissionRow (new component)
```

---

## Technical Details

### New Files to Create

1. **`src/components/lessonplan/HomeworkSubTabs.tsx`**
   - Container component with sub-tab navigation
   - Manages active sub-tab state
   - Renders Assign or Track content based on selection

2. **`src/components/lessonplan/HomeworkTrackingView.tsx`**
   - Displays lessons that have homework assigned
   - Filters lessons to only show those with homework
   - Collapsible cards per lesson

3. **`src/components/lessonplan/HomeworkTrackingCard.tsx`**
   - Individual lesson card for tracking
   - Shows homework preview and student list
   - Displays submission progress summary

4. **`src/hooks/useHomeworkTracking.ts`**
   - Fetches students by class_year_id
   - Fetches/saves homework submission statuses
   - Manages submission state updates

### Files to Modify

1. **`src/pages/teacher/TeacherMLPDetailPage.tsx`**
   - Replace Homework tab content with `HomeworkSubTabs` component
   - Pass necessary props (lessons, classId, etc.)

2. **`src/hooks/useTeacherLessonPlans.ts`**
   - Add function to fetch lessons with homework only
   - Add homework tracking functions

### Database Migration

```sql
-- Create homework_submissions table
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_detail_id UUID NOT NULL REFERENCES lesson_plan_details(id) ON DELETE CASCADE,
  class_year_id INTEGER NOT NULL REFERENCES class_years(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ,
  marked_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique combination per lesson/class/student
  UNIQUE(lesson_plan_detail_id, class_year_id, student_id)
);

-- Add indexes for common queries
CREATE INDEX idx_homework_submissions_lesson ON homework_submissions(lesson_plan_detail_id);
CREATE INDEX idx_homework_submissions_class ON homework_submissions(class_year_id);
CREATE INDEX idx_homework_submissions_student ON homework_submissions(student_id);

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can manage submissions for their assigned classes
CREATE POLICY "Teachers can manage homework submissions for assigned classes"
  ON homework_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lesson_plan_teacher_assignments lpta
      JOIN lesson_plan_details lpd ON lpd.id = homework_submissions.lesson_plan_detail_id
      JOIN lesson_weeks lw ON lw.id = lpd.week_id
      JOIN lesson_topics lt ON lt.id = lw.topic_id
      WHERE lpta.lesson_plan_id = lt.lesson_plan_id
        AND lpta.teacher_user_id = auth.uid()
    )
  );
```

### Auto-Create Tracking Records
When a teacher assigns homework (saves homework text to a lesson), the system will automatically create submission tracking records for all students in assigned classes. This can be handled via:
- A database trigger on `lesson_plan_details` update
- Or application logic when saving homework

---

## User Flow

1. Teacher navigates to Lesson Plan > Homework tab
2. **Assign sub-tab** (default):
   - Teacher enters/edits homework for lessons
   - Upon saving, tracking records are created for students in assigned classes
   
3. **Track sub-tab**:
   - Shows only lessons with assigned homework
   - Teacher selects a class from the header dropdown
   - Expands a lesson to see student list
   - Checks/unchecks submission status for each student
   - Progress bar shows completion (e.g., "15/22 submitted")

---

## Implementation Sequence

1. Create database migration for `homework_submissions` table
2. Create `useHomeworkTracking.ts` hook for data fetching/saving
3. Create `HomeworkSubTabs.tsx` component
4. Create `HomeworkTrackingView.tsx` component
5. Create `HomeworkTrackingCard.tsx` component
6. Update `TeacherMLPDetailPage.tsx` to use new components
7. Test end-to-end flow
