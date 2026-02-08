
# Plan: Add "Insert from Lesson Plan" Button to Homework Form

## Summary
Add a button to the Homework Assignment form that allows teachers to insert/restore the homework text that's already saved in the lesson plan. This gives teachers the flexibility to:
- Quickly restore the original homework if they cleared the textarea
- Use the saved homework as a starting point and modify it

---

## Current Behavior

The `TeacherHomeworkForm` component:
1. Receives `lesson` prop which contains `lesson.homework` (the saved homework from the database)
2. Initializes local state `homework` with `lesson.homework`
3. Teachers can type in the textarea and save

**The Issue**: If a teacher clears the textarea or wants to reset to the original, they have no easy way to restore it without refreshing the page.

---

## Proposed Solution

Add a small "Insert from Lesson Plan" button above or beside the textarea that:
1. Copies the original `lesson.homework` value into the textarea
2. Is only visible/enabled when there's saved homework to insert
3. Uses a subtle styling to not distract from the main save action

---

## UI Design

```
┌─────────────────────────────────────────────────┐
│ 📋 Homework Assignment          [Insert from LP]│
├─────────────────────────────────────────────────┤
│                                                 │
│  [Textarea for homework entry...]               │
│                                                 │
└─────────────────────────────────────────────────┘
│          [💾 Save Homework]                     │
└─────────────────────────────────────────────────┘
```

The "Insert from LP" button will:
- Appear on the right side of the label row
- Use `variant="outline"` with sky theme colors
- Show a clipboard/copy icon
- Be disabled if no saved homework exists
- Have tooltip or helper text explaining the action

---

## Implementation Details

### File: `src/components/lessonplan/TeacherHomeworkForm.tsx`

**Changes:**

1. **Add import** for the `ClipboardCopy` icon (or similar)

2. **Update the label row** (lines 85-89) to include the insert button:

**Before:**
```tsx
<Label htmlFor={`homework-${lesson.id}`} className="text-sm font-medium flex items-center gap-2">
  <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
  Homework Assignment
</Label>
```

**After:**
```tsx
<div className="flex items-center justify-between">
  <Label htmlFor={`homework-${lesson.id}`} className="text-sm font-medium flex items-center gap-2">
    <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
    Homework Assignment
  </Label>
  {lesson.homework && lesson.homework.trim() && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setHomework(lesson.homework || "")}
      disabled={homework === lesson.homework}
      className="h-7 text-xs gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"
    >
      <ClipboardCopy className="h-3 w-3" />
      Insert from Lesson Plan
    </Button>
  )}
</div>
```

3. **Button Logic:**
   - Only shows if `lesson.homework` exists and is not empty
   - Disabled if current textarea already matches the saved homework
   - Clicking sets the textarea to `lesson.homework`

---

## Visual Outcome

**Before:**
- Teachers must manually retype or remember original homework if cleared

**After:**
- A small "Insert from Lesson Plan" button appears when saved homework exists
- One click restores/inserts the original homework into the textarea
- Button is disabled when textarea already matches saved content (no action needed)
- Uses sky-blue theme consistent with the Homework tab

---

## Files to Modify

1. `src/components/lessonplan/TeacherHomeworkForm.tsx`
   - Add `ClipboardCopy` import
   - Update label section to include the insert button
   - Button triggers `setHomework(lesson.homework)`
