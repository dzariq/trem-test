## Goal

Bus attendance for outdoor CCAs is a round trip, so it needs to be taken twice:
1. **Outbound** — School → Venue (did the student board the bus at school)
2. **Return** — Venue → School (did the student board the bus back at the venue)

The DB already supports this (`cca_bus_assignments.departed_school` + `departed_venue`, plus matching `_at` / `_by` audit columns and `return_remark`). The current UI only writes the legacy single `attended` flag. This plan rewires the UI to use the two leg flags and presents them as two clearly separated sections.

## Scope

Frontend only. No schema changes. No RLS changes (existing bus-PIC write policy already covers all leg columns).

## Audit findings (current state)

- `BusAttendanceList.tsx` renders one Present/Absent toggle per student writing to `attended`. Per-bus summary chips count `attended` only.
- `useCcaOutdoorBuses.ts` selects only `attended, marked_at, marked_by` and writes only those fields.
- `departed_school`, `departed_venue`, `return_remark` are defined in `supabase/types.ts` but never read or written.
- No leg-aware UI exists anywhere else.

## Changes

1. **`src/hooks/useCcaOutdoorBuses.ts`**
   - Extend `CcaBusAssignment` to include `departed_school: boolean | null` and `departed_venue: boolean | null` (drop reliance on legacy `attended` for new UI but keep it in the type for backward compat).
   - Extend the `select(...)` to include the two leg flags + their `_at` / `_by` columns.
   - Replace `markAttendance(assignment, attended)` with `markLeg(assignment, leg: "outbound" | "return", value: boolean | null)`. Internally maps:
     - `outbound` → `{ departed_school, departed_school_at: now(), departed_school_by: uid }`
     - `return`   → `{ departed_venue,  departed_venue_at:  now(), departed_venue_by:  uid }`
   - Optimistic update and saving-by-assignment key becomes `"<assignmentId>:<leg>"` so the two legs can save independently without UI flicker.
   - Reload query updated accordingly.

2. **`src/components/cca/BusAttendanceList.tsx`** — restructure each bus card.
   - Replace the single student row with **two stacked sections per bus**:
     - **Section A — "Outbound · School → Venue"** with its own Present/Absent count chips (uses `departed_school`).
     - **Section B — "Return · Venue → School"** with its own count chips (uses `departed_venue`).
   - Each section shows the same student list; each row keeps the existing Take-Attendance icon button pair (green Check / red X, 48×40, tap-active to toggle off), bound to the relevant leg.
   - Independent loading spinners per leg per row.
   - Section header uses small lucide icons (`ArrowRight` for outbound, `ArrowLeft` for return) and the bus's own name only appears once at the top of the card.
   - Read-only viewers (non-PIC) see two read-only status badges side by side, labelled `Out` and `Back`.
   - Empty bus / no-assignment state unchanged.

3. **Optional follow-up (NOT in this plan, flag for later)**: surface `return_remark` as an inline textarea per student in the Return section. Skipping for now to keep this change focused; will revisit if the user asks.

4. **No changes** to RLS, migrations, `useIsBusPicForActivity`, `useCcaActivityPermissions`, or `SessionDetailsSheet`.

## Verification

- Open an outdoor session as activity PIC / bus PIC.
- Each bus card now shows two sub-sections: Outbound and Return.
- Marking Present in Outbound only updates `departed_school` (verify via DB read); Return remains unmarked. Same for the other leg.
- Tapping the same active button clears the leg (writes `null`).
- Count chips per section reflect that leg only.
- Parents and non-bus teachers see no change (bus list still hidden for them).
- Legacy `attended` column is left untouched (read-only legacy data).