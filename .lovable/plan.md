## Goal

Switch the **Attendance Overview** chart on `AttendancePage` from raw day counts (stacked bars 0–12) to an **attendance percentage** per month, with the raw days shown in brackets (e.g. `92% (11/12 days)`).

The "Monthly Summary" card below (Present / Absent / Late / Excused tiles) stays unchanged — it still shows raw counts for the selected month.

## Formula

For each month bucket:

```text
attended   = present + late
totalDays  = present + absent + late + excused   // recorded school days
pct        = totalDays > 0 ? round(attended / totalDays * 100) : 0
```

Months with no records render as an empty bar (no label, no tooltip).

## Changes

### 1. `src/hooks/useParentAttendance.ts`

In both `chartData` memos (yearly hook + rolling hook), enrich each month entry with:

- `attended` (present + late)
- `totalDays` (sum of the four statuses)
- `pct` (rounded 0–100, or `null` when totalDays === 0)

Keep `present / absent / late / excused` on the entry too — the tooltip will still show the breakdown.

### 2. `src/pages/AttendancePage.tsx` — Attendance Overview chart only

- Replace the four stacked `<Bar>` elements with a **single** `<Bar dataKey="pct" />` filled with the primary green (`hsl(160, 84%, 39%)`), rounded top corners.
- `<YAxis domain={[0, 100]} ticks={[0,25,50,75,100]} tickFormatter={(v) => \`${v}%\`} />`.
- Remove the `<Legend>` (no longer meaningful with one series).
- Add a `<LabelList>` on the bar showing `{pct}%` above each bar (hidden when `pct === null`).
- Update the custom tooltip payload so the active month shows:
  - Title: month name
  - Big line: `92% (11/12 days)`
  - Breakdown lines: Present 9 · Late 2 · Absent 1 · Excused 0
- Empty-state check (`showEmptyState`) stays as-is.

### 3. No DB / RLS / business-logic changes

Pure presentation refactor in the parent attendance page and its data hook.

## Out of scope

- Home page `AttendanceSummary` pie (unchanged).
- The "May 2026" four-tile summary card below the chart (unchanged — still raw counts).
- Teacher attendance views.
