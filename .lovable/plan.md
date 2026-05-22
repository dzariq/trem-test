## Outdoor CCA — display & permission audit

### Problem
The mobile "My CCAs" list treats every outdoor activity the same as a club, so a bus PIC sees a giant "Basketball · PIC" card with no trip date and no indication that their actual role is "Bus A · Main". It also currently allows the bus PIC to take regular session attendance, which should be gated by sport-PIC vs bus-PIC roles.

### Data model recap

```text
cca_activities (kind='outdoor')   ← the trip (e.g. "Basketball" on 21 May)
 ├─ cca_sessions                  ← one row per trip date (sport_activity_ids[] = sub-sports)
 │   └─ cca_session_sport_pics    ← per-session, per-sport lead teachers
 ├─ cca_outdoor_buses             ← buses for the trip (teacher_pic_main / teacher_pic_sub)
 │   └─ cca_bus_assignments       ← students on each bus + outbound/return marks
 └─ cca_activity_teachers         ← parent-trip PIC/Co-PIC (separate from bus + sport)
```

### Changes

**1. Card display (`TeacherCcaPage` + `CcaActivityCard`)**

For outdoor cards only:
- Title becomes `"<Trip name> · <Next trip date>"` (e.g. `"Basketball · 21 May 2026"`); fall back to trip name only when no upcoming session.
- Replace the role badge with the user's *actual* outdoor role, in priority order:
  - `Bus A · Main` / `Bus B · Sub` (from `cca_outdoor_buses`)
  - `Sport PIC` (from `cca_session_sport_pics`) with one chip per sport they lead (`Pickleball`, `Ping Pong`, …)
  - `PIC` / `Co-PIC` (from `cca_activity_teachers`) — fallback for parent-trip PICs
- A teacher who is both bus PIC and sport PIC sees the bus chip first, sport chips underneath.

**2. Hook (`useTeacherInvolvedCcas`)**

Extend the role resolution to additionally pull:
- `cca_session_sport_pics` rows for this user → enriches activity with `sportRoles: { activityId, sportName }[]`
- `cca_outdoor_buses` → already pulled; add the `bus_name` and which slot (`main` / `sub`) so the chip can render.
- Add `nextSessionDate` to the activity (already partly available via `sessions` array — pick the soonest future one).
- The composite role becomes an array (`myRoles: OutdoorRole[]`) so a single trip card can describe multiple involvements.

**3. Outdoor detail page permissions (`TeacherCcaDetailPage`)**

For activities with `kind='outdoor'`:
- Everyone with any outdoor role (bus PIC, sport PIC, activity PIC) can view Overview / Schedule / Sports / Venue / Buses tabs (read-only).
- **Bus attendance (outbound + return)**: only the `teacher_pic_main` or `teacher_pic_sub` of *that specific bus* can mark. Sport PICs and other bus PICs see the roster read-only.
- **Sport-session attendance**: hidden for outdoor trips (the existing "Attendance" tab is repurposed to the Buses tab for outdoor kind).
- The detail page already drops the Attendance tab for outdoor — keep that and surface a "Buses" tab instead, with per-bus expanders that show the roster + outbound/return mark buttons (disabled when not a PIC of that bus).

**4. Permission helpers**

Add a small `useCcaOutdoorRoles(activityId)` hook that returns:
```ts
{ isBusMainOf: Set<busId>, isBusSubOf: Set<busId>, sportLeadFor: Set<activityId>, isTripPic: boolean }
```
Used by the card, the detail header, and the bus attendance buttons.

### Out of scope (will not touch this round)
- The other project's admin assignment sync that is currently auto-adding the bus PIC as `cca_activity_teachers` PIC. We'll only consume what's in the DB — but the new card design means even if that stale PIC row exists, the bus chip is shown first so the user sees their real role.
- New tables or RLS. All needed tables/policies already exist.

### Acceptance
- Junhan sees `Basketball · 21 May 2026` with chip `Bus A · Main` instead of a misleading `PIC` badge.
- Junhan sees `Badminton · 18 May 2026` with chips `Bus B · Sub`, `Sport PIC: Badminton`, `Pickleball`, `Ping Pong`.
- On the Basketball outdoor detail page, the Outbound / Return mark buttons are enabled only on Bus A's roster; all other buses are read-only.
