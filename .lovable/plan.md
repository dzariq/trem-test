## Goal
Make all data screens stay fresh in the installed mobile app — when the user backgrounds and reopens the app (or switches tab in the browser), the visible page silently re-fetches its data. Today only the Home screens do this.

## Approach
One global "app resume" signal, applied at the data-layer (hooks) so every page that uses those hooks gets refresh for free. Pages that load data directly in their own `useEffect` get a one-line opt-in.

### 1. Promote the resume detector to a tiny app-wide bus
Refactor `src/hooks/useRefreshOnAppResume.ts` so the listener for `visibilitychange` / `window.focus` / Capacitor `App.appStateChange` runs **once globally** and fans out to subscribers:

```text
src/lib/appResumeBus.ts        // subscribe(cb) / emit() with single listener
src/hooks/useRefreshOnAppResume.ts  // thin React wrapper that subscribes
```

Add a "minimum away time" gate (default 30 s) so quickly tabbing away and back doesn't fire refetches.

### 2. New small hook `useRefetchOnResume(fn)`
A two-line hook used inside data hooks (calls `fn()` when the bus fires). Keeps data hooks tidy and avoids importing React lifecycles into every fetcher.

### 3. Wire into the data hooks (one-line each)
Add `useRefetchOnResume(refetch)` to:

- **CCA**: `useUpcomingCcaSessions`, `useCcaSessionsCalendar`, `useCcaActivities`, `useStudentCcaEnrollments`, `useCcaSessions`, `useCcaActivityById`
- **Academic**: `useStudentGradesByPeriods`, `useStudentReportCard`, `useStudentGradeGoals`, `useGradeEntry` (teacher), `useClassAnalysisData`
- **Attendance**: `useParentAttendance`, `useStudentAttendanceSummary`, `useTeacherAttendance`, `useAttendanceStatistics`
- **Homework / Lesson plans**: `useStudentHomework`, `useHomeworkTracking`, `useLessonPlans`, `useTeacherLessonPlans`
- **Invoice**: `useStudentInvoices`
- **Notifications**: `useNotifications` (also keep its realtime channel)
- **PDF / docs**: `useSchoolDocument` (timetable, handbook PDFs)

### 4. Page-level opt-in for screens that fetch in their own `useEffect`
Add `useRefreshOnAppResume(loader)` to:

- `CalendarPage` + `TeacherCalendarPage` (announcements / calendar events / CCA sessions)
- `AnnouncementsPage` + `TeacherAnnouncementsPage`
- `ParentTimetablePage`, `TeacherTimetablePage` (PDFs)
- `StudentHandbookPage`, `TeacherHandbookPage`
- `VisaPage`
- `AcademicPage`, `TeacherAcademicPage` (period / class context loaders)
- `AttendancePage`, `TeacherAttendancePage`
- `HomeworkPage`
- `InvoicePage`
- `ParentCcaPage` + detail, `TeacherCcaPage` + detail
- `NotificationsPage` + `TeacherNotificationsPage`

Existing `HomePage` and `TeacherHomePage` keep their per-page wiring (already shipped).

### 5. Cache-bust strategy for PDFs / images
- Use `import.meta.env` for static assets (unchanged).
- For Supabase Storage URLs that may be replaced (announcement banners, CCA hero images, timetable PDFs), append a cache-busting query param using the row's `updated_at` so the OS WebView doesn't serve stale binaries. Apply where we already build signed/public URLs (`useSchoolDocument`, announcement attachment resolver, CCA image hook).

## Out of scope
- No realtime Postgres channels added (would change RLS load profile).
- No global React Query migration.
- No DB / RLS / edge function changes — purely client.

## Verification
- Background the installed app for >30 s on each module, return, and confirm fresh data without a manual reload.
- Quick app-switch (<30 s) does **not** trigger refetches (verify in network tab).
- Pull-to-refresh continues to work where it already exists.
- Web tab focus also re-fetches.
