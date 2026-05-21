# Teacher CCA Detail Page — Audit & Mobile Improvement Plan

## 1. What's working well

- **Architecture**: Single source of truth via `useTeacherInvolvedCcas` + `useCcaActivityPermissions`. Tab-switched layout avoids deep drawer nesting.
- **Permissions**: PIC-only actions (edit image, add/edit/cancel/delete sessions, take attendance) are correctly gated by `perms.canEdit`.
- **Outdoor support**: Members tab auto-swaps to `BusAttendanceList` when `kind === "outdoor"`.
- **Schedule UX**: Active vs cancelled split, restore button, confirm-delete dialog.
- **Reuse**: Pulls in existing `SessionAttendanceList`, `BusAttendanceList`, `CcaImageUpload`, `PICTeachersList`, `SessionFormDialog`, `CcaActivityImage` — no duplication.

## 2. Audit findings (issues, in priority order)

### Critical / High

1. **Sticky tab bar collides with sticky header** — both use `sticky top-[calc(env(safe-area-inset-top)+56px)]`. `TeacherAppLayout` also has its own top chrome. On iOS notch devices the tab bar ends up sitting *behind* the header strip when scrolled. Needs measured offset or `position: sticky; top: 0` inside a scroll container.
2. **Page-level header is duplicated** — `DetailHeader` is rendered *inside* `TeacherAppLayout`, which already renders `AppHeader` on most teacher routes. Result: on some entry points there are two stacked headers eating ~120px of vertical space (huge on a 390×673 viewport).
3. **`fetchSessions` is called from two tabs independently** (`SchedulePanel` and `AttendancePanel`). Switching tabs re-fetches each time → duplicate network calls, flashes loading state. Should hoist sessions to page level or cache via React Query.
4. **No back-swipe / safe-area on bottom** — `pb-24` is hardcoded; doesn't account for iOS home indicator (`env(safe-area-inset-bottom)`). Tab navigation bar will overlap last session card.
5. **Hero image not tap-to-enlarge** on mobile — PIC sees upload affordance but normal teachers can't view full-res image; on Capacitor users expect pinch-zoom.

### Medium

6. **Tab strip overflow on small screens**: 6 pills (Overview / Schedule / Members / Attendance / Venue / Budget) overflow horizontal scroll without any scroll-snap or scroll-into-view-on-select. Hidden tabs to the right are invisible — no fade/chevron hint.
7. **Members tab has no search / no avatars / no class grouping / no count by class**. For a 25-student club it's fine; for an event with 100+ students it's a flat list.
8. **Attendance tab requires two taps (pick session → mark)** but doesn't auto-select today's session. PIC opens it expecting today.
9. **Schedule "Add Session" button is full-width outline** but the more important PIC action is buried below. Consider a sticky FAB on Capacitor.
10. **Image upload** on Capacitor uses `<input type="file">` — opens file picker, not native camera. Should use `@capacitor/camera` plugin to give "Take photo / Choose from gallery".
11. **Pull-to-refresh missing** — Capacitor users expect to pull to refetch sessions/roster/permissions.
12. **No haptics** — tab switches, save, delete confirms should `Haptics.impact()` on native.
13. **Budget tab is a placeholder** — currently always visible even though empty. Either hide for now or label "Coming soon" in the tab pill.
14. **Status bar styling** — Capacitor config has no `StatusBar` plugin entry. On Android the system bar overlaps the sticky header.
15. **InfoRow truncates with `truncate`** — long venue / coordinator emails get cut without tooltip. On mobile this hides info.
16. **`isOutdoor` swap silently relabels Members → Bus list**, but Attendance tab still uses generic `SessionAttendanceList` — outdoor activities should hide that tab (bus attendance lives in Members) to avoid two competing flows.

### Low / Polish

17. PIC pill uses `text-[10px]` while bucket pill uses default — visual mismatch.
18. Schedule cards use `bg-card` while overview uses an emerald card — inconsistent panel styling.
19. No empty-state CTA on Members ("Invite students" / "Open enrollment").
20. `DetailHeader` title is hardcoded "My CCA" — should show CCA name truncated so user sees context when sticky.
21. Cancelled-session restore icon is `RotateCcw` (looks like undo) — fine, but no tooltip on mobile.

## 3. Capacitor-specific check

- `capacitor.config.ts` is minimal: only `SplashScreen` configured. Missing:
  - `StatusBar` plugin (style + background color matching theme)
  - `Keyboard` plugin (`resize: "body"` to avoid form pushing tabs offscreen)
  - `Haptics` plugin
  - `Camera` plugin (for hero image upload)
  - `App` listener for hardware back button (Android: pressing back inside detail page exits the app instead of going to `/teacher/cca`)
- `ios.contentInset: "always"` is correct, but no `webView` background color set → white flash on navigation.
- No deep-link / universal link config for `/teacher/cca/:id` notifications.
- `webDir: "dist"` ok. No `bundledWebRuntime` issue.

## 4. Proposed improvement plan

### Phase A — Layout & safe-area (highest ROI, low risk)

1. Remove duplicate `DetailHeader` when `TeacherAppLayout` already renders its own; or pass `hideHeader` to layout on this route.
2. Replace hardcoded `pb-24` with `pb-[calc(6rem+env(safe-area-inset-bottom))]`.
3. Fix sticky tab top offset: measure header height via `ResizeObserver` OR move tabs into a non-sticky position right under hero and rely on a thin sticky strip only when scrolled past hero.
4. Show CCA name in sticky header (replace "My CCA").
5. Add fade-edge / chevron hint on horizontal tab strip; auto-scroll active pill into view.

### Phase B — Performance & data

6. Hoist `useCcaSessions` to `TeacherCcaDetailPage` and pass down to both Schedule + Attendance. One fetch per visit.
7. Migrate `useActivityRoster` to TanStack Query with `staleTime: 60s` so tab-switching is instant.
8. Add pull-to-refresh wrapper (lightweight: `react-pull-to-refresh` or custom touch handler) → calls `refetch()` + invalidate.

### Phase C — Mobile interactions

9. Attendance: auto-select today's session if present; otherwise show picker.
10. Sticky FAB (`Plus`) bottom-right on Schedule tab for PIC (replaces full-width outline button).
11. Tap hero image → open `Dialog` with full-screen image (pinch-zoom on Capacitor).
12. Hide Attendance tab when outdoor (bus list is the attendance flow); hide Budget tab until backend exists.
13. Members tab: search input, group by class, show count per class header, show student initial avatar.

### Phase D — Capacitor native polish

14. Add and configure plugins in `capacitor.config.ts`:
    - `StatusBar` (style `LIGHT` for primary header, background = theme bg)
    - `Keyboard` (`resize: "body"`)
    - `Haptics`
    - `Camera` — wire to `CcaImageUpload` with "Take photo / Choose from gallery / Cancel" action sheet
    - `App` — listen for `backButton` and route to `/teacher/cca` instead of exiting
15. Add `Haptics.impact({ style: "light" })` on: tab change, save session, confirm delete, mark attendance.
16. Set Capacitor webview background to design `--background` token to remove white flash.
17. Register deep link `collinz://teacher/cca/:activityId` for push notifications opening the right CCA.

### Phase E — Visual polish

18. Unify pill sizes (PIC, bucket, role) at `text-xs`.
19. Use consistent card surface for all panels (drop emerald-only overview card; promote shared tokenized `Card`).
20. Long-press a session card → action sheet (Edit / Cancel / Delete) — fewer icons in card row, cleaner.
21. Empty-state CTAs (Members → link to enrollment; Schedule → "Add your first session").

## 5. Out of scope (flag, don't build)

- Budget tab data model + schema (needs design first).
- CCA attendance analytics / charts.
- Photo gallery from past sessions (would need new table).

## 6. Suggested rollout order

```text
A1 → A2 → A3 → A4   (layout, ~1 patch)
B1 → B2             (data hoist, ~1 patch)
C1 → C2 → C3 → C4   (mobile UX, ~1 patch)
D1 → D2 → D3        (Capacitor plugins, ~1 patch)
E (polish)          (last)
```

No database / RLS changes required for any of the above. Parent mobile app contract is untouched.

---

**Ask before implementing**: Do you want me to ship **all of Phase A + B + the Capacitor plugin setup (D)** in the first pass — i.e. the things that visibly fix layout, double-fetching, and native feel — and leave the Members search / FAB / camera wiring for a second pass? Or pick a different subset.