## Issue

On `/parent/calendar → CCA Activities`, the "Enrolled" and "Available" cards (and their detail sheets) were designed before the 3-kind taxonomy (Club / Outdoor / Event). They show a generic category badge and weekly meeting day/time — fine for clubs, but events have no recurring meeting day and parents currently see almost nothing useful for them. Other parent-relevant signals (kind bucket, upcoming session date for events, classes involved, requirements, capacity, coordinator email) are missing.

## Plan

### 1. Surface the kind bucket on cards (`src/components/cca/CcaActivityCard.tsx`)

Replace the category-only badge on the hero image with a **kind bucket badge** (Club / Outdoor / Event) using existing `getCcaBucket`, `getCcaTypePillColor`, `getCcaBucketIcon` helpers — same visual language as the calendar capsules and the event details drawer. Keep `typeName` (subcategory like "Indoor CCA / Sports") as a smaller secondary line under the title.

### 2. Make the card kind-aware (same file)

- **Clubs & Outdoor:** keep existing `meetingDay` + `meetingTime` row (weekly schedule).
- **Events:** weekly meeting fields are usually blank. Show the **next upcoming session date** from `activity.sessions` instead (label "Next: Sat 23 May · 9:00 AM"), falling back to "Date to be announced" if none. Available on `CcaActivity.sessions` already.
- **Capacity** (clubs/outdoor only, when `maxParticipants` is set): small "Up to N spots" hint under schedule. Skip for events.
- Location, PIC teacher list: keep as-is.

The enrolled-card branch shares the same component, so the same logic applies there. `EnrolledCcaActivity` doesn't carry `sessions`/`maxParticipants` — degrade gracefully (no Next row, no capacity hint).

### 3. Enrich the Enrolled details sheet (`src/components/cca/CcaDetailsSheet.tsx`)

- Replace the plain category badge in the title with the kind bucket pill (icon + Club/Outdoor/Event), keep subcategory as a small line.
- Add **Upcoming Sessions** block (next up to 3 from `activity.sessions`, future-only, sorted ascending) showing date, time range, and location. Only render when there is at least one upcoming session.
- Show **Capacity** row ("X spots") when `maxParticipants` is set.
- Show **Contact** row with `coordinatorEmail` as a `mailto:` link when set.
- Keep existing Requirements (use the *next upcoming* session's requirements, not `sessions[0]` which may be in the past).
- Hide the Operational Notes block for parents (it's already gated by `isPIC`, leave as-is).

### 4. Enrich the Available details bottom sheet (inline in `src/pages/CalendarPage.tsx`)

Mirror the same enrichments on the inline `BottomSheet` used for "Available CCA" cards:
- Kind bucket pill in title (instead of the `getCcaCategoryColor` category badge).
- For events: Upcoming Sessions block + Classes Involved chips (so the parent can confirm their child's class is in scope).
- For clubs/outdoor: Capacity row when `maxParticipants` is set.
- Coordinator email contact row when set.

To support "Classes Involved" on this sheet for events, extend `useEligibleCcaActivities` to also select `classes_involved` and expose it on the `CcaActivity` type. No new query — single column add to the existing `.select(...)`.

### 5. Out of scope

- Teacher CCA calendar — only the parent surfaces here.
- New RLS / migrations / RPCs.
- Restyling the card hero / image — only badges and info rows change.
- Showing enrolled-student lists or attendance.

### Technical notes

Files touched:
- `src/components/cca/CcaActivityCard.tsx` — bucket badge, kind-aware "Next" / weekly schedule row, capacity hint.
- `src/components/cca/CcaDetailsSheet.tsx` — bucket pill in title, upcoming sessions block, capacity, coordinator email, requirements from next session.
- `src/pages/CalendarPage.tsx` — same enrichments for the inline Available CCA bottom sheet; classes involved chips for events.
- `src/hooks/useEligibleCcaActivities.ts` — add `classesInvolved: string[]` (select `classes_involved`).

No DB / schema / RLS changes.