## Issue

On the parent **Calendar → Main Calendar** view (month / week / day), tapping a CCA capsule does nothing. Only regular event chips open the details drawer. Reason: `MonthGridCalendar` and `TimeGridCalendar` already accept an `onSessionClick` prop and fire it on CCA chips, but `CalendarPage.tsx` never passes a handler — so the click is a no-op.

The "Upcoming → CCA" tab already opens `EventDetailsSheet` correctly, but the sheet was designed around `UpcomingCcaSession` and shows only generic Date / Time / Location / Description, with a plain "CCA" + category badge. It doesn't surface the kind (Club / Outdoor / Event), the underlying activity name when a custom session title is used, or session-specific extras like requirements.

## Plan

### 1. Wire CCA capsule clicks on grids (`src/pages/CalendarPage.tsx`)

Add an `openCcaSessionDetails` helper and pass it as `onSessionClick` to both `MonthGridCalendar` and `TimeGridCalendar`:

```text
onSessionClick={(session) => {
  setSelectedEventDetails(session);
  setEventDetailsOpen(true);
}}
```

`CcaCalendarSession` (from `useCcaSessionsCalendar`) already includes `kind` (added earlier), so the sheet can render kind-aware UI. Widen `selectedEventDetails` state type to `UpcomingEvent | UpcomingCcaSession | CcaCalendarSession | null`.

### 2. Make `EventDetailsSheet` CCA-aware (`src/components/events/EventDetailsSheet.tsx`)

- Accept either CCA shape (`UpcomingCcaSession` from the Upcoming card, or `CcaCalendarSession` from the grid). The existing `"sessionDate" in event` guard already covers both — just update the union type.
- Replace the generic "CCA" + raw `category` badges in the title with a **bucket badge** using the existing `getCcaBucket` / `getCcaTypePillColor` / `getCcaBucketIcon` helpers from `@/components/cca/CcaTypeTabs`:
  - Club → yellow pill + Users icon + label "Club"
  - Outdoor → orange pill + Bike icon + label "Outdoor"
  - Event → amber pill + PartyPopper icon + label "Event"
  - Bucket is derived from `session.kind` first, then `session.category` as fallback.
- When `customTitle` is set, show the actual activity name as a secondary subtitle line under the title (e.g. small muted "Activity: <activityName>"). Currently this info is lost.
- Add a **Requirements** row (icon + label) below Location when the session has a non-empty `requirements` string (only present on `CcaCalendarSession`). Hide otherwise.
- Hide the trailing tag-list block for CCA (it only ran for non-CCA already, keep as-is).
- Only render the Description block when description is a non-empty string; do not render a literal "-".
- Same for Location: hide the row if there is no location.

### 3. Out of scope

- Teacher calendar (separate page; only fix if user reports it).
- PIC teacher / enrolled-students lists inside the drawer (would need extra queries; user only asked for key info).
- Visual restyle of the drawer beyond the bucket badge + requirements row.

### Technical notes

Files touched:
- `src/pages/CalendarPage.tsx` — pass `onSessionClick` to both grid components; widen the `selectedEventDetails` state union.
- `src/components/events/EventDetailsSheet.tsx` — union type widening, bucket-based badge/icon, optional activity-name subtitle, optional Requirements row, conditional Location/Description rendering.

No DB / RLS / schema changes. No new hooks.