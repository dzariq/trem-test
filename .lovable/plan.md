

# Plan: Move Class Selector to Header (Same Row as Subject)

## Summary
Move the class selector from inside the Reflections tab to the header area, placing it on the same row as the subject name. This makes class selection consistent across all three tabs (Content, Reflections, and Homework).

---

## Current State

**Header Structure (lines 297-314):**
```
[Back Button] [Subject Name]
              [Year Level • Academic Year]
```

**Class Selector Location:**
- Currently inside the Reflections tab only (lines 398-414)
- Not visible in Content or Homework tabs

---

## Proposed Design

**New Header Layout:**
```
[Back Button] [Subject Name]        [Class Dropdown ▼]
              [Year Level • Academic Year]
```

The class dropdown will:
- Appear on the right side of the header row
- Be positioned next to the subject name
- Use a compact styling to fit in the header
- Remain visible across all tabs

---

## Implementation Details

### File: `src/pages/teacher/TeacherMLPDetailPage.tsx`

**Step 1: Update Header Layout**

Modify the header section (lines 298-314) to:
- Add flex row layout with space-between for the main header
- Place the class selector on the right side of the subject name row
- Use a compact select trigger with reduced width

**Before:**
```tsx
<div className="flex items-center gap-3 px-4 py-3">
  <Button variant="ghost" size="sm" onClick={...}>
    <ArrowLeft className="h-4 w-4" />
  </Button>
  <div className="flex-1 min-w-0">
    <h1 className="text-sm font-semibold truncate">{planInfo.subject}</h1>
    <p className="text-xs text-muted-foreground">
      {planInfo.yearLevel} • {planInfo.academicYear}
    </p>
  </div>
</div>
```

**After:**
```tsx
<div className="flex items-center gap-3 px-4 py-3">
  <Button variant="ghost" size="sm" onClick={...}>
    <ArrowLeft className="h-4 w-4" />
  </Button>
  <div className="flex-1 min-w-0">
    <h1 className="text-sm font-semibold truncate">{planInfo.subject}</h1>
    <p className="text-xs text-muted-foreground">
      {planInfo.yearLevel} • {planInfo.academicYear}
    </p>
  </div>
  {/* Class Selector - Moved to header */}
  <Select
    value={selectedClassId?.toString() || ""}
    onValueChange={(val) => setSelectedClassId(val ? parseInt(val) : undefined)}
  >
    <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs">
      <SelectValue placeholder="Class" />
    </SelectTrigger>
    <SelectContent>
      {assignedClasses.map((cls) => (
        <SelectItem key={cls.classYearId} value={cls.classYearId.toString()}>
          {cls.className}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Step 2: Remove Class Selector from Reflections Tab**

Delete the class selector block from inside the Reflections tab (lines 397-414):
```tsx
// Remove this block:
<div className="sticky top-[88px] z-10 px-4 py-3 bg-background border-b border-border">
  <Select...>
</div>
```

**Step 3: Update "Select a class" Empty State**

The "Select a class to view reflections" message becomes less relevant since the class selector is always visible in the header. However, we should still handle the case where no class is selected.

Update the empty state styling to work with the new layout (adjust the `top` offset for sticky elements since the class selector row is removed).

---

## Visual Outcome

**Before:**
- Class selector only visible in Reflections tab
- Users must switch to Reflections tab to change class
- Inconsistent experience across tabs

**After:**
- Class selector visible in header at all times
- Same row as the subject name (right-aligned)
- Consistent class selection across Content, Reflections, and Homework tabs
- Compact dropdown that doesn't clutter the header

---

## Files to Modify

1. `src/pages/teacher/TeacherMLPDetailPage.tsx`
   - Move Select component to header area
   - Remove redundant class selector from Reflections tab
   - Adjust sticky positioning offsets

