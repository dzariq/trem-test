## Goal
Make the Teacher **Academic** page (`src/pages/teacher/TeacherAcademicPage.tsx`) and the parent `AcademicPage.tsx` ready for Capacitor wrapping (App Store / Play Store), matching the mobile-native standards already applied to the Calendar module.

## Findings

| # | Issue | Location | Risk on native |
|---|---|---|---|
| 1 | Floating Save FABs use `bottom-24 right-4` with no safe-area inset | lines 1859, 2325, 6348 | On iPhones with home indicator, FAB sits on top of the home bar / is partially obscured |
| 2 | Performance / report dialogs use `h-[85vh]` and `max-h-[90vh]` | lines 3419, 3542 | Doesn't follow project standard (75vh `h-[100dvh]` draggable bottom sheet); breaks on iOS Safari address-bar resize |
| 3 | Period tab buttons + several action buttons are `min-h-9` (36 px) | line 1655 and similar | Below 44 px iOS HIG tap target — fails Apple review guideline |
| 4 | Popovers use `z-50` instead of project standard `z-[100]` for mobile overlays | lines 5379, 5508, 5634 | Can be hidden behind sheets/dialogs/drawers |
| 5 | No pull-to-refresh on Academic page (Calendar already has it) | whole page | Inconsistent native UX |
| 6 | Number inputs don't pin font-size ≥ 16 px | line 2183 mark inputs, comment textareas | iOS auto-zooms on focus when font < 16 px |
| 7 | No `active:` / pressed state on custom buttons (only `hover:`) | period tabs, FABs, year/class chips | Mobile users get no tap feedback |
| 8 | `bottom-24` FABs don't account for the bottom tab bar height + safe area combined | FAB lines | May overlap bottom navigation on smaller devices |
| 9 | No keyboard-aware scrolling when comment textareas focus | grade & comment textareas | Keyboard covers the input on iOS — needs `@capacitor/keyboard` integration or `scrollIntoView` on focus |
| 10 | The page never explicitly sets the StatusBar style for iOS dark/light | global, but Academic page is the heaviest module | Status bar text can disappear on white backgrounds |

(Items 9 + 10 are global concerns surfaced here; will be addressed in their own dedicated Capacitor pass — flagged but **not** in scope of this plan unless you want them included.)

## Plan (in scope: Academic page only)

### 1. Safe-area aware FABs
Replace each occurrence of:
```
fixed z-50 ... bottom-24 right-4 ...
```
with:
```
fixed z-[60] ... right-[calc(env(safe-area-inset-right)+1rem)]
bottom-[calc(env(safe-area-inset-bottom)+6rem)] ...
```
Three locations: Save Comments FAB (1859), Save Recommendations FAB (2325), Save Grades FAB (6348).

### 2. Tap target compliance (≥ 44 px)
- Period tabs: change `min-h-9` → `min-h-11` (44 px), keep wrap layout from previous fix.
- Year/class chip buttons + small icon buttons inside the report cards: bump to `min-h-11 min-w-11` where they are pure tap targets.

### 3. Overlay z-index normalization
- All `<PopoverContent>` and floating menus inside this page: `z-50` → `z-[100]` to match the global mobile overlay standard.

### 4. Dialog → mobile-friendly sheet
- `Performance Dialog` (3418) and the report dialogs (3542, etc.): switch from `h-[85vh]` / `max-h-[90vh]` to the project standard `h-[100dvh] max-h-[75vh]` with `pb-[calc(env(safe-area-inset-bottom)+1rem)]` so content never hides behind the home indicator. Keep desktop fallback via `sm:` breakpoint.

### 5. Add Pull-to-Refresh
- Mirror the Calendar implementation:
  - Import `usePullToRefresh` + `PullToRefreshIndicator`.
  - Wrap the outer scroll container with `ref={pullRef}` and place `<PullToRefreshIndicator …/>` at the top.
  - `onRefresh` triggers `gradeEntry.refetch()` + `analytics.refetch()` (whatever the existing react-query hooks expose).

### 6. iOS keyboard zoom prevention
- Mark/grade `<Input type="number">` and the comment/recommendation `<Textarea>` with explicit `text-base` (16 px) on mobile (`text-base sm:text-sm`) so iOS doesn't auto-zoom on focus. No behavioural change.

### 7. Tap feedback
- Add `active:scale-[0.98] active:bg-muted/70` (or theme-token equivalent) to:
  - Period tab buttons,
  - Top/Middle/At-risk performance cards,
  - The three FABs.
- Add `[touch-action:manipulation]` where missing to prevent the 300 ms tap delay.

### 8. Quick verification pass (not code edits)
- Re-render at 390×733 mobile preview.
- Confirm no horizontal overflow, no obscured FAB, dialogs stay within visible viewport.
- Confirm keyboard interactions still work in browser preview (real native verification happens after `npx cap sync`).

## Out of scope (call out only — separate pass needed)
- Adding `@capacitor/keyboard` global handler.
- StatusBar style configuration in `App.tsx`.
- Splash-screen / icon asset re-generation.
- Auditing the Parent `AcademicPage.tsx` (5,539 lines) — happy to do a follow-up plan for it.

## Files to be touched
- `src/pages/teacher/TeacherAcademicPage.tsx` (all changes above)

No DB / RLS / edge-function changes. No new dependencies (pull-to-refresh hook + indicator already exist).
