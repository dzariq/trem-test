## Goal

Remove the top tab switcher (Calendar / CCA Schedule) on the Calendar module for both Parent and Teacher portals, since the "My CCAs" tab already covers CCA browsing. The page becomes a single, unified calendar view.

CCA sessions remain visible inside the calendar grid (they're already merged into the month/week/day views via `ccaSessions={gridCcaSessions}`), so no functional CCA loss — only the redundant secondary tab and its standalone CCA list view are removed.

## Changes

### `src/pages/CalendarPage.tsx` (parent)
- Remove `<Tabs>`, `<TabsList>`, both `<TabsTrigger>`s, and the `value="cca"` `<TabsContent>` block.
- Keep the contents of the `value="calendar"` tab as the page body (MonthGridCalendar / TimeGridCalendar / Upcoming sections).
- Drop the `Tabs*` imports and the `initialTab` logic if it becomes unused.

### `src/pages/teacher/TeacherCalendarPage.tsx` (teacher)
- Same treatment: strip the tab wrapper and the CCA tab content, render only the calendar view.
- Drop unused `Tabs*` imports.

### Out of scope
- No changes to `MonthGridCalendar`, `TimeGridCalendar`, filters, or CCA sessions data hooks.
- No changes to the My CCAs pages or routing.
- No DB / notification changes.
