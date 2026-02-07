

# Calendar "Upcoming Events" Tab Enhancement

## Overview

Update the Upcoming Events section at the bottom of the Calendar page to:
1. Rename "Upcoming" tab to "Events" and filter by Events, Students, and Parents categories
2. Apply dynamic color styling to the selected tab that matches the filter button colors

## Changes Summary

### Visual Changes
- "Upcoming" tab becomes "Events" (purple when selected)
- "Exams" tab shows red background when selected
- "Holidays" tab shows green background when selected
- Unselected tabs remain neutral/gray

### Filtering Logic
- **Events tab**: Shows events from `events`, `students`, and `parents` tag categories (Special Events, Internal Events, Field Trips, Student Extra Classes, PTC, Family Events, etc.)
- **Exams tab**: Unchanged - shows exam events
- **Holidays tab**: Unchanged - shows holiday events

---

## Technical Implementation

### Step 1: Update Tab Configuration in `src/lib/calendarFilters.ts`

```text
Current:
- UpcomingTab = "upcoming" | "exams" | "holidays"
- UPCOMING_TABS = [{ value: "upcoming", label: "Upcoming" }, ...]

Changes:
- Rename type value from "upcoming" to "events"
- Update label from "Upcoming" to "Events"
- Add tab color mapping constant:
  UPCOMING_TAB_COLORS = {
    events: purple classes,
    exams: red classes,
    holidays: green classes
  }
```

### Step 2: Add isEventsEvent() filter function in `src/lib/calendarFilters.ts`

Create a new filter function to check if an event belongs to the "Events", "Students", or "Parents" categories:

```typescript
const isEventsEvent = (event: UpcomingEvent): boolean => {
  // Check tags for events, students, parents categories
  if (event.tags.some((tag) => {
    const cat = TAG_CATEGORIES[tag];
    return cat === "events" || cat === "students" || cat === "parents";
  })) {
    return true;
  }
  // Also check category string field
  const category = (event.category || "").toLowerCase();
  return category.includes("event") || 
         category.includes("student") || 
         category.includes("parent");
};
```

### Step 3: Update filterByUpcomingTab() function

Modify the switch case to use the new "events" value and call `isEventsEvent()` instead of showing all future events.

### Step 4: Update UpcomingEventsSection component in `src/components/calendar/UpcomingEventsSection.tsx`

- Import the new tab color mapping
- Apply dynamic styling to `TabsTrigger` based on active tab:
  - When "events" is active: purple background (`bg-purple-500 text-white`)
  - When "exams" is active: red background (`bg-red-500 text-white`)
  - When "holidays" is active: green background (`bg-green-500 text-white`)

```tsx
<TabsTrigger 
  key={tab.value} 
  value={tab.value} 
  className={cn(
    "text-xs",
    activeTab === tab.value && UPCOMING_TAB_COLORS[tab.value]
  )}
>
  {tab.label}
</TabsTrigger>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/calendarFilters.ts` | Rename tab type/label, add color map, add `isEventsEvent()`, update `filterByUpcomingTab()` |
| `src/components/calendar/UpcomingEventsSection.tsx` | Import colors, apply dynamic tab styling |

---

## Expected Behavior After Implementation

1. Tab bar shows: **Events** | **Exams** | **Holidays**
2. Clicking "Events" shows purple tab and filters to event/student/parent items
3. Clicking "Exams" shows red tab and filters to exam items
4. Clicking "Holidays" shows green tab and filters to holiday items
5. Inactive tabs remain neutral gray

