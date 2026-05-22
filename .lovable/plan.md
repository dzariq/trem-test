## Goal

For outdoor activity detail page, give every teacher with any outdoor role (bus main/sub PIC, sport main/sub PIC, trip PIC/Co-PIC) the same unified view with exactly four tabs:

1. **Overview** — trip summary + Schedule rendered inline (already inline today)
2. **Sports** — list of sub-sports for the trip with their leads, venue, capacity
3. **Venue** — trip venue card (unchanged)
4. **Buses** — bus list with rosters and outbound/return attendance (current "Bus list" tab, renamed)

The detail page renders identically regardless of which outdoor role the teacher holds. Permission gating stays at the action level (e.g. only that bus' Main/Sub PIC can mark its attendance), not at the tab/visibility level.

## Changes

### 1. `src/pages/teacher/TeacherCcaDetailPage.tsx`
- Replace the outdoor tab array with: `Overview`, `Sports`, `Venue`, `Buses` (in this order).
- Keep non-outdoor activities on their existing tab set (`Overview`, `Members`, `Attendance`, `Venue`) — unchanged.
- Rename outdoor "Bus list" label to **Buses**; tab id can stay `members` internally to avoid a large refactor, but the rendered label and order change.
- Add a new tab id `sports` for outdoor only.
- Overview already renders Schedule inline — no change needed there.

### 2. New `SportsPanel` (inline in same file or `src/components/cca/SportsPanel.tsx`)
Reads sub-sports for the outdoor trip:
- Source: distinct `sport_activity_ids` across all `cca_sessions` of the trip, joined to `cca_activities` for name/venue, and to `cca_session_sport_pics` for sport leads (main/sub).
- Each row shows: sport name, lead teachers (chips with Main/Sub), session date(s), capacity if available.
- Read-only for everyone in this iteration (no attendance taking from this tab).

### 3. No permission changes
- All four tabs are visible to any teacher returned by `useTeacherInvolvedCcas` for that trip.
- Bus attendance buttons in the Buses tab keep the existing rule: only that bus' Main or Sub PIC can mark; others see roster read-only. (Already implemented in earlier step.)

## Out of scope
- Card display on the My CCAs list — already handled in the prior change.
- Sport-session attendance taking — Sports tab is read-only for now.
- Parent / student-facing views.

## Technical notes
- `TabId` type gets a new `"sports"` member; switch block adds `{tab === "sports" && isOutdoor && <SportsPanel activityId={activity.id} />}`.
- `SportsPanel` uses a `useQuery` that fetches sessions → derives unique sport activity ids → fetches activity names + sport pics in two parallel queries, memoizes the joined view model.
- No DB schema, no RLS, no new tables.
