

# Plan: Fix Tab Highlight Styling and Update Week Tabs to Light Green

## Summary
This plan addresses two issues in the lesson plan tabs:
1. Fix the mismatch between rounded box corners and sharp highlight edges when tabs are selected
2. Change the Week 1/Week 2/Week 3 tabs from gray to a light green color scheme for better visual appeal

---

## Problem Analysis

### Issue 1: Sharp Highlight Edges
- The `TabsList` container uses `rounded-lg` (8px border radius)
- The `TabsTrigger` uses `rounded-md` (6px border radius) 
- The focus ring uses `ring-offset-2` which creates a 2px gap with sharp corners
- When a tab is selected, the background highlight doesn't match the outer container's rounded corners

### Issue 2: Gray Color Theme
- Currently the `TabsList` uses `bg-muted/50` which appears as a subtle gray
- The user wants the Week tabs (Beginning, Middle, End in the Lesson Flow Editor) to use a light green theme consistent with other parts of the app

---

## Solution

### Changes to `src/components/ui/tabs.tsx`

**TabsList Updates:**
- Keep `rounded-lg` for the container
- Add consistent padding to allow tab triggers to sit nicely inside

**TabsTrigger Updates:**
- Change `rounded-md` to `rounded-lg` to match the container's border radius
- Ensure the active state background fills the space properly with matching rounded corners

### Changes to `src/components/lessonplan/LessonFlowEditor.tsx`

**Color Theme Updates:**
- Update the `TabsList` to use a light green background instead of gray
- Update the `TabsTrigger` active state to use a green highlight color
- Apply consistent green theme: lighter green for inactive tabs, darker green for active selection

---

## Technical Details

### File 1: `src/components/ui/tabs.tsx`

Update the `TabsTrigger` component:
- Change `rounded-md` to `rounded-lg` to match container corners
- This ensures the selected highlight has rounded edges that match the container

```typescript
// Before
"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 ..."

// After  
"inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 ..."
```

### File 2: `src/components/lessonplan/LessonFlowEditor.tsx`

Update the `TabsList` with a light green theme:
- Change `bg-muted/50` to use `bg-primary/10` (light green background)
- Add custom styling to the `TabsTrigger` for green active state

```tsx
// Updated TabsList
<TabsList className="grid w-full grid-cols-3 mb-4 h-auto bg-primary/10 p-1">
  <TabsTrigger 
    value="beginning" 
    className="text-xs flex-col py-2 px-1 gap-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
  >
    ...
  </TabsTrigger>
  // Similar for middle and end tabs
</TabsList>
```

---

## Visual Outcome

**Before:**
- Tabs have gray background with sharp-edged selection highlights
- Week tabs appear dull and inconsistent with the app's green theme

**After:**
- Tabs have rounded selection highlights matching the container corners
- Week tabs (Beginning, Middle, End) have a light green theme:
  - Container: Light green tint (`bg-primary/10`)
  - Active tab: Slightly darker green background (`bg-primary/20`) with green text
  - Inactive tabs: Muted text on transparent background

---

## Files to Modify

1. `src/components/ui/tabs.tsx` - Fix rounded corners on TabsTrigger
2. `src/components/lessonplan/LessonFlowEditor.tsx` - Apply light green color theme

