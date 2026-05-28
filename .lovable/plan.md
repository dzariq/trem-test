# Mirror Web App: Exclude Weekends & Holidays From Attendance

Bring the mobile app in sync with the web app so that attendance dates and percentages exclude weekends and main-calendar holidays. Pure client-side filtering — no DB changes.

## 1. New shared utility — `src/lib/attendanceCalendar.ts`

- `HOLIDAY_CATEGORY_NAMES = ['Public Holiday', 'Replacement Public Holiday', 'School Holiday (Term Break)']`
- `buildHolidayDateSet(events, rangeStart?, rangeEnd?) → Set<string>` of `YYYY-MM-DD` keys.
  - A calendar event counts as a holiday if its category name OR any tag (from `event_tags`) matches `HOLIDAY_CATEGORY_NAMES`.
  - Iterate `start_date → end_date` inclusive, compare as date-only strings (avoids timezone drift on `timestamptz`).
  - Optional `rangeStart`/`rangeEnd` clip iteration to the visible window.
- `isBlockedAttendanceDate(date, holidaySet)` → true when `date.getDay() === 0 || 6`, or `format(date,'yyyy-MM-dd')` is in the set.
- Uses `date-fns` (already in the project) — not dayjs, to match existing conventions.
- Small helper `fetchHolidayEventsForRange(start, end, campusCode)` that pulls rows from `calendar_events` filtered to the holiday categories/tags only (used by attendance views without going through `listCalendarEvents`'s role visibility filter, which would otherwise hide events from teachers/parents).

## 2. Teacher Attendance — date picker

File: `src/pages/teacher/TeacherAttendancePage.tsx` (+ `useTeacherAttendance` if needed).

- On the date picker (`Calendar` component) used for "select attendance date":
  - Fetch holidays for the visible month range, build `holidaySet`.
  - Pass `disabled={(d) => isBlockedAttendanceDate(d, holidaySet)}` so weekends + holidays are visually un-selectable.
- Also block them in any inline list of dates (e.g. quick-pick rows).
- Add a tiny legend hint ("Weekends & school holidays unavailable") under the picker.

## 3. Attendance Statistics — `src/hooks/useAttendanceStatistics.ts`

For every percentage/denominator (yearly chart, monthly summary KPIs, daily breakdown, concerns):

```
schoolDays = eachDayOfInterval({start, end})
  .filter(d => !isBlockedAttendanceDate(d, holidaySet)).length
expectedRecords = schoolDays * distinctStudentCount
attendanceRate = (present + late) / expectedRecords * 100
```

- Fetch holidays for the relevant range (year for yearly, month for monthly, custom window for concerns).
- Filter raw attendance rows to drop any record whose `date` lands on a blocked day (defensive — keeps charts clean even if a stray weekend record exists).
- Recompute `chartData`, `monthlySummary`, `dailyBreakdown`, and `computedConcerns.totalDays` against the blocked-aware school-day count.
- Include a `holidayKey` (sorted serialized set) in the dependency array / future React Query key so cache invalidates when holidays change.

## 4. Parent / homepage attendance summary

- `src/hooks/useStudentAttendanceSummary.ts` and `src/components/home/AttendanceSummary.tsx`:
  - Fetch holidays for the rolling 30/60/90-day window.
  - Drop blocked-day records from totals and use blocked-aware denominators when computing percentages displayed in the donut.
- `src/hooks/useParentAttendance.ts` + `src/pages/AttendancePage.tsx`: apply the same filter so parent-side stats match teacher-side numbers.

## 5. QA

- `tsc --noEmit` clean.
- Manual check: open Teacher Attendance → weekends greyed out, a known public holiday greyed out.
- Statistics: pick a month with a known holiday and verify denominator drops by that day × student count, and that the displayed % matches `(present+late) / expected`.
- Homepage donut and parent attendance page show identical % for the same window.

## Technical notes

- Reuse existing `mapCalendarRow` shape (`category`, `tags`, `start_date`, `end_date`) — no new types needed beyond the utility's input contract.
- Keep the utility framework-agnostic (no React/Supabase imports) so it can be unit-tested and reused by both teacher and parent flows.
- No schema changes; no migrations; no edge functions.
