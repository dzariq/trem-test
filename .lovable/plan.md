# Performance refactor — safe, staged

The profile of the current `/parent/calendar` route shows:

- DOM Content Loaded **7.6s**, First Contentful Paint **7.7s**
- 248 script requests, 2.87 MB total JS
- Top offenders (loaded even though unused on this route):
  - `TeacherAcademicPage.tsx` — 320 KB, 8003 lines, 1.77 s
  - `AcademicPage.tsx` — 190 KB, 5596 lines, 1.76 s
  - `TeacherAttendancePage.tsx` — 70 KB, 1789 lines, 1.50 s
  - `TimeGridCalendar.tsx` — 29 KB, 742 lines, 1.37 s

Root cause: every page is imported eagerly at the top of `App.tsx`, so visiting any route forces every other route's JS to load. This is the dominant problem — no behavior changes needed to fix it.

The plan is two stages. Only Stage 1 is required now — it's low risk, no behavior change, and will deliver the biggest win. Stages 2 are optional follow-ups we can do later.

---

## Stage 1 — Route-level code splitting (low risk, high payoff)

Convert page imports in `src/App.tsx` to `React.lazy()` and wrap the routed area in a single `<Suspense>` fallback. Pages keep working identically; they just load on demand.

What gets touched:

1. `src/App.tsx` — replace ~30 `import Page from "@/pages/..."` with `const Page = lazy(() => import("@/pages/..."))`.
2. Wrap `<Routes>` in `<Suspense fallback={<RouteFallback />}>` — a tiny spinner that matches the app shell (no layout shift).
3. Add `RouteFallback` component (just the existing skeleton/spinner style used elsewhere).

Safety:
- Pure structural change. No props, no hooks, no Supabase touched.
- Route guards (`ParentStudentGuard`, `TeacherGuard`) keep working — they wrap the lazy-loaded component the same way.
- Each route is tested independently; any failure is isolated to one page.
- Eagerly-loaded shared components (layout, header, providers) stay eager.

Expected result on this profile:
- Initial JS drops by ~60–70% (the 320 KB + 190 KB Academic pages stop loading on Calendar).
- First Contentful Paint should drop from ~7.7 s to roughly 2–3 s.
- Each route pays a small, one-time load cost on first navigation (cached afterwards).

## Stage 2 — Cleanup (still low risk, smaller wins)

A. **Remove unused announcement components** — `FeaturedAnnouncementCard.tsx`, `PinnedAnnouncementCard.tsx`, `AnnouncementListCard.tsx` were superseded by the unified `AnnouncementCard.tsx`. Verify no remaining imports, then delete. ~3 files removed.

B. **`lucide-react` import audit** — `lucide-react` deps file is 156 KB. If anywhere we import the whole library (rare in this codebase but worth grepping), switch to named imports. Most likely already fine, but cheap to verify.

C. **Split `VisaPage.tsx`** (525 lines) into a folder of small components under `src/components/visa/`. Pure file move, no behavior change. Optional — only do if maintainability is the goal, won't affect perf.

---

## Out of scope (deliberately deferred)

- **Splitting `TeacherAcademicPage.tsx` (8003 lines) and `AcademicPage.tsx` (5596 lines).** These deserve a refactor, but breaking them apart safely requires understanding every state interaction inside them. After Stage 1, they no longer hurt other routes, so the urgency drops. We can tackle them as a focused follow-up where the only goal is splitting that one page, with you testing after each section is extracted.
- **`TimeGridCalendar.tsx` rewrite.** It's heavy but functional and recently audited. Lazy-loading the calendar route alone will give us most of the benefit.
- **Replacing the React Query staleTimes / data hooks.** Not the bottleneck.

---

## Validation checklist (after Stage 1)

1. Hard-refresh `/parent/home`, `/parent/calendar`, `/parent/academic`, `/parent/cca`, `/parent/announcements`, `/parent/invoices`, `/parent/support`, `/parent/visa` — each loads, shows its fallback briefly, then renders normally.
2. Same checks for the teacher portal main routes.
3. Re-run the perf profile on `/parent/calendar` — confirm FCP drops and the Academic pages are no longer in the network waterfall.
4. Confirm no console errors on route transitions.

If anything regresses on a specific page, we revert that page back to eager import — the rest stays lazy.
