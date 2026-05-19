## Goal

Let a teacher who is assigned as a **bus PIC** (main or sub) take bus attendance on outdoor CCAs from the teacher app — even when they're not the activity PIC and don't teach an eligible year level. Restyle the per-student row to match the existing "Take Attendance" design (large Present / Absent icon buttons, status summary chips).

Backend RLS already allows this: bus PICs can `SELECT` from `cca_outdoor_buses` / `cca_bus_assignments` and `UPDATE` the `attended` flag. The gap is purely in the frontend gating and visual design.

## Scope

Frontend only. No DB migrations, no RLS changes, no new tables. Parents are never affected — bus list stays teacher-only.

## Changes

1. **New hook `src/hooks/useIsBusPicForActivity.ts`**
   - Input: `activityId`.
   - Queries `cca_outdoor_buses` for that activity, returns `true` when the current `auth.uid()` matches `teacher_pic_main` or `teacher_pic_sub` on any bus.
   - Lightweight: only runs when caller is a teacher and `activityId` is set.

2. **`src/components/cca/SessionDetailsSheet.tsx`**
   - Call `useIsBusPicForActivity(session.activityId)` when `isOutdoor`.
   - Render `BusAttendanceList` when `isOutdoor && (perms.canViewBuses || isBusPicForActivity)`.
   - Pass a synthesized perms object (or extend the existing one) so `canViewBuses` is forced `true` for the bus-PIC-only case, while `canEdit` stays whatever it was (bus PIC won't get activity-edit powers).

3. **`src/components/cca/BusAttendanceList.tsx` — visual redesign of the per-student row**
   Reference: `src/pages/teacher/TeacherAttendancePage.tsx` (the Take Attendance UI).
   - Replace the small 32 px "P" / "A" text buttons with the same two-button pattern used on the attendance page: ~48×40 rounded buttons with `Check` (green) and `X` (red) icons. Active state uses the same emerald / rose tokens already on the page; toggling the active status clears it (parity with `handleStatusChange`).
   - Keep loading spinner inline while saving.
   - Keep the per-bus header (bus name, PIC main/sub names, capacity, Present/Absent/Unmarked counts) — these match the summary chip style of the attendance page; just normalise spacing/typography to feel like the attendance card.
   - Non-PIC viewers (activity PIC viewing someone else's bus, or year-overlap teacher) keep the read-only `Present / Absent / Unmarked` badge.
   - No new statuses — buses only have `attended: true | false | null` (no Late/Excused).

4. **No changes** to:
   - `useCcaActivityPermissions` (kept stable; bus-PIC visibility handled at the consumer).
   - `useCcaBusPermissions` (already grants `canManageBus` to bus PIC).
   - `useCcaOutdoorBuses` (reload + optimistic update already correct).
   - DB / RLS / migrations.

## Verification

- Sign in as a teacher who is **only** `teacher_pic_main` on a bus (not activity PIC, no year overlap): open the outdoor session → bus list now appears, only their bus's students are toggleable, other buses are read-only.
- Sign in as activity PIC: still sees all buses, can mark all (unchanged).
- Sign in as parent: bus list still hidden (unchanged).
- Visual: Take Attendance and Bus Attendance per-student rows look consistent (same icon buttons, colours, sizing).