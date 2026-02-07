
# CCA Card UI/UX Improvements

## Overview

Redesign the teacher display in "My CCAs (Enrolled)" cards to be more compact and visually appealing, with color-coded teacher pills and a short description.

## Current State Issues

From the screenshot:
- Teacher pills are too large (showing name + department + "(Lead)" text)
- Takes up too much vertical space on mobile
- No description visible on the card
- Color scheme uses green tones that don't differentiate lead from supporting teachers

## Design Changes

### 1. Simplified Teacher Pills

**Before:**
```
[ Teacher Adam (Lead)  ]  [ Test 5      ]
  Maths, Science            (gray bg)
  (green bg)
```

**After:**
```
[ Teacher Adam ]  [ Test 5 ]
  (yellow bg)      (light yellow bg)
```

Changes:
- Remove department text from pills
- Remove "(Lead)" text label
- Make pills single-line (name only)
- Reduce padding for compact size

### 2. Color Scheme Update

| Teacher Type | Background Color | Text Color |
|--------------|------------------|------------|
| Lead (Primary) | `bg-yellow-400` (bright yellow) | `text-yellow-900` |
| Supporting | `bg-yellow-100` (light yellow) | `text-yellow-800` |

### 3. Add Description

Show the `publicDescription` field on the card (truncated to 2 lines):
- Position: Below the title/badges, above meeting time
- Style: Small text, muted color, line-clamp-2 for overflow

## Technical Implementation

### File: `src/components/cca/PICTeacherPill.tsx`

Create a new compact variant of the pill component:

```tsx
// Add new prop: variant = "default" | "compact"
// When variant="compact":
// - Only show teacher name (no departments)
// - No "(Lead)" text
// - Smaller padding: px-2 py-1
// - Color based on isPrimary:
//   - Primary: bg-yellow-400 text-yellow-900
//   - Non-primary: bg-yellow-100 text-yellow-800
```

Update `PICTeachersList` to accept a `variant` prop and pass it to pills.

### File: `src/pages/CalendarPage.tsx`

Update the enrolled CCA card rendering:

1. Add description display after the title section:
```tsx
{activity.publicDescription && (
  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
    {activity.publicDescription}
  </p>
)}
```

2. Use compact variant for teacher pills:
```tsx
<PICTeachersList
  teachers={activity.picTeachers}
  fallbackCoordinator={null}
  variant="compact"
/>
```

## Visual Mockup (After)

```text
+--------------------------------------------------+
| Art Club                    [Enrolled] [Indoor]  |
|                                                  |
| Explore creativity through painting and drawing  |
|                                                  |
| (clock) Wednesday, 3:30 PM - 5:00 PM             |
| (pin)   Art Room                                 |
| (user)  [Teacher Adam] [Test 5]                  |
|          (yellow)       (light yellow)           |
+--------------------------------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/cca/PICTeacherPill.tsx` | Add `variant` prop for compact mode with yellow color scheme |
| `src/pages/CalendarPage.tsx` | Add description display, use compact teacher pills |

## Expected Behavior

1. Teacher pills show only names (no departments, no "Lead" text)
2. Lead teacher has bright yellow background
3. Supporting teachers have light yellow background
4. Pills are smaller and more compact
5. CCA description appears below the title (2 lines max)
6. Overall card is more informative yet less cluttered
