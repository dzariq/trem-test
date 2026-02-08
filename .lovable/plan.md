

# Plan: Fix "Insert from Lesson Plan" Button Logic

## The Problem

The "Insert from Lesson Plan" button in the Homework tab is showing but **appears disabled** when you first expand a lesson card. This is because:

1. When the card expands, the textarea is pre-filled with the saved homework (`lesson.homework`)
2. The button is disabled when the textarea content matches the saved homework
3. Since they match on first load, the button is always disabled initially

This creates a confusing experience - the button is visible but can't be clicked.

---

## The Fix

Change the logic so the button works as expected:

**Current Logic (problematic):**
- Button shows only when homework exists in the database
- Button disabled when textarea content = database content

**New Logic:**
- Button shows only when homework exists in the database
- Button should NOT prevent clicks if the content matches (it just won't change anything)
- Add proper visual feedback with a try-catch wrapper for safety

---

## Implementation

### File: `src/components/lessonplan/TeacherHomeworkForm.tsx`

**Change 1: Remove the disabled condition that blocks the button**

Currently (line 97):
```tsx
disabled={homework === lesson.homework}
```

Change to allow clicking even when content matches - the click will just set the same value (no harm):
```tsx
// Remove the disabled prop entirely, or use a different condition
```

**Change 2: Add try-catch safety and better UX**

Wrap the onClick handler with error handling:
```tsx
onClick={() => {
  try {
    if (lesson.homework) {
      setHomework(lesson.homework);
      // Optionally show a toast on success
    }
  } catch (error) {
    console.error("Error inserting from lesson plan:", error);
  }
}}
```

**Change 3: Improve button visibility logic**

The button should show when there's saved homework AND be clickable. We can keep it disabled only when truly not applicable (e.g., if for some reason the homework couldn't be inserted).

---

## Updated Code

```tsx
{lesson.homework && lesson.homework.trim() && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => {
      try {
        setHomework(lesson.homework || "");
      } catch (error) {
        console.error("Error inserting from lesson plan:", error);
      }
    }}
    className="h-7 text-xs gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"
  >
    <ClipboardCopy className="h-3 w-3" />
    Insert from Lesson Plan
  </Button>
)}
```

---

## Behavior After Fix

| Scenario | Button Visible | Button Clickable | Result |
|----------|----------------|------------------|--------|
| Homework exists in DB | Yes | Yes | Inserts homework into textarea |
| No homework in DB | No | N/A | Button hidden |
| Textarea already has same content | Yes | Yes | No visual change (same content) |
| Textarea has different content | Yes | Yes | Replaces with saved homework |

---

## Files to Modify

1. `src/components/lessonplan/TeacherHomeworkForm.tsx`
   - Remove `disabled={homework === lesson.homework}` condition
   - Add try-catch wrapper to onClick handler

