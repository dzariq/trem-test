
# Plan: Fix Content Tab Hover Highlights and Apply Green Theme

## Summary
Fix the hover highlight overflow issue in the Content tab where the gray highlight extends beyond the rounded corners of cards. Also change from gray colors to light green colors to match the Content tab's theme.

---

## Problem Analysis

From the screenshot, the issue is visible on "Week 1: HAHAHAH i think this work?" - the gray hover highlight bleeds outside the rounded card container.

**Root Cause:**
1. The `CardHeader` has `hover:bg-muted/50` but the parent `Card` doesn't have `overflow-hidden` to clip the hover background within the rounded corners
2. The Content tab uses gray (`muted`) colors instead of green (`primary`) colors like the Homework tab uses blue (`sky`) colors

**Comparison:**
| Element | Current (Content) | Homework Tab | Should Be (Content) |
|---------|------------------|--------------|---------------------|
| Topic border | default | `border-sky-200/50` | `border-primary/30` |
| Topic hover | `hover:bg-muted/50` | `hover:bg-sky-50/50` | `hover:bg-primary/10` |
| Week bg | `bg-muted/30` | `bg-sky-50/30` | `bg-primary/5` |
| Week border | default | `border-sky-200/50` | `border-primary/30` |
| Week hover | `hover:bg-muted/50` | `hover:bg-sky-100/50` | `hover:bg-primary/10` |
| Icons | `text-muted-foreground` | `text-sky-600` | `text-primary` |
| Badge | default secondary | `bg-sky-100 text-sky-700` | `bg-primary/10 text-primary` |

---

## Implementation Details

### File: `src/pages/teacher/TeacherMLPDetailPage.tsx`

The Content tab currently uses the shared `renderLessonStructure` function. Since we need different styling for Content (green) vs the generic structure, we'll need to either:

**Option A**: Update the `renderLessonStructure` to accept theme parameters
**Option B**: Create a dedicated Content tab structure like Homework has

**Chosen Approach**: Option B - Create dedicated Content structure matching Homework's pattern for consistency and cleaner code.

**Changes:**

1. **Replace the Content tab** from using `renderLessonStructure` to a dedicated green-themed structure similar to how Homework tab is implemented

2. **Apply green theme throughout:**
   - Topic Card: `border-primary/30` + `overflow-hidden`
   - Topic Header hover: `hover:bg-primary/10`
   - Topic chevron icons: `text-primary`
   - Week Badge: `bg-primary/10 text-primary`
   - Week Card: `bg-primary/5 border-primary/30 overflow-hidden`
   - Week Header hover: `hover:bg-primary/10`
   - Week chevron/loader icons: `text-primary`

3. **Add `overflow-hidden`** to all Cards to ensure hover effects are clipped within rounded corners

---

## Code Changes

**Lines ~369-410**: Replace the Content tab implementation

**Before:**
```tsx
{activeTab === "content" && renderLessonStructure(
  (lesson) => (
    <Card className={cn("cursor-pointer transition-colors", ...)}>
      ...
    </Card>
  ),
  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />,
  "No topics found",
  ""
)}
```

**After:**
```tsx
{activeTab === "content" && (
  <div className="p-4 space-y-3 pb-24">
    {topics.length === 0 ? (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-primary/50 mb-3" />
        <p className="text-muted-foreground">No topics found</p>
      </div>
    ) : (
      topics.map((topic) => (
        <Collapsible key={topic.id} open={...} onOpenChange={...}>
          <Card className="border-primary/30 overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="py-3 px-4 cursor-pointer hover:bg-primary/10">
                {/* Green-themed chevron icons */}
                <ChevronDown className="h-4 w-4 text-primary" />
                {/* Green badge */}
                <Badge className="bg-primary/10 text-primary">
                  {weeksCount} weeks
                </Badge>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Week cards with green theme */}
              <Card className="bg-primary/5 border-primary/30 overflow-hidden">
                <CardHeader className="hover:bg-primary/10">
                  {/* Green chevrons */}
                </CardHeader>
                {/* Lessons... */}
              </Card>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))
    )}
  </div>
)}
```

---

## Visual Outcome

**Before:**
- Gray hover highlights extend beyond rounded card corners
- Gray theme doesn't match the green Content tab

**After:**
- Hover highlights are properly contained within rounded corners (via `overflow-hidden`)
- Light green theme throughout Content tab:
  - `bg-primary/10` for hover states
  - `bg-primary/5` for week card backgrounds
  - `border-primary/30` for subtle green borders
  - `text-primary` for icons and badges
- Consistent with how Homework (blue) and Reflections (yellow) tabs are styled

---

## Files to Modify

1. `src/pages/teacher/TeacherMLPDetailPage.tsx`
   - Replace Content tab's `renderLessonStructure` call with dedicated green-themed structure
   - Add `overflow-hidden` to all Cards
   - Apply green color classes throughout
