Move the parent student dropdown out of the cramped header right-side slot and into a prominent full-width row directly below the nav, matching the Announcements page pattern (people icon + student name, full-width select trigger).

## Pages affected
All parent routes that currently pass `showChildSelector` to `AppHeader`, plus `My CCAs`:
- Home (header stays as-is — kept compact since it has greeting/avatar)
- Attend (`AttendancePage`)
- Academic (`AcademicPage`)
- Calendar (`CalendarPage`)
- Homework (`HomeworkPage`)
- Invoices (`InvoicePage`)
- Support (`SupportPage`)
- My CCAs (`ParentCcaPage` — custom header)

(Announcements already follows this pattern — used as the reference.)

## Implementation

1. **`src/components/layout/AppHeader.tsx`** — stop rendering `<ChildSelectorDropdown />` inside the header's right slot. Instead, when `showChildSelector` is true and the user is on a parent route, render a second sticky row directly under the header bar containing a full-width student selector trigger styled like the Announcements one (People icon + student name + chevron, `h-10`, `flex-1`, rounded). It remains sticky as part of the same header element so it stays visible while scrolling.

2. **`src/components/home/ChildSelectorDropdown.tsx`** — add a `variant?: "compact" | "bar"` prop. `compact` keeps the existing small trigger (still used for Home if needed). `bar` renders a wider trigger with a `Users` icon prefix and `flex-1` width for the new sub-row.

3. **`src/pages/ParentCcaPage.tsx`** — this page has its own custom header. Remove the dropdown from the header row, restore the simple `< My CCAs` title, then add the same sticky sub-row below it using the `bar` variant.

4. No prop changes needed on the page level — every page already passes `showChildSelector` to `AppHeader`, so the new sub-row appears automatically.

## Visual result

```text
┌─────────────────────────────────────────────┐
│ 🏫  Attendance              🔔   👤          │  ← title row
├─────────────────────────────────────────────┤
│ 👥  Tang Jia Hao                         ▾ │  ← new prominent selector row
└─────────────────────────────────────────────┘
```

Files to touch:
- `src/components/layout/AppHeader.tsx`
- `src/components/home/ChildSelectorDropdown.tsx`
- `src/pages/ParentCcaPage.tsx`

No backend, RLS, or data changes.
