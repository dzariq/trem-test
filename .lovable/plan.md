# Academic pages refactor — conservative, staged

Two files, both with one giant default-export component:

- **`TeacherAcademicPage.tsx`** — 8003 lines, 1 component, 18 useState/useCallback handlers, many helpers defined inside the component.
- **`AcademicPage.tsx`** — 5596 lines, same shape.

Both share the same overall pattern: a top-level `<Tabs>` with 2 sections, and one of those sections contains a nested `<Tabs>` with 3–5 sub-tabs. Each sub-tab is a large self-contained JSX block. That's our seam.

The goal is **maintainability, not performance** (Stage 1 lazy-loading already solved perf). We will not change a single line of logic — only move blocks of JSX into separate files and pass the values they already use as props.

---

## Confirmed structure

### TeacherAcademicPage (lines)

| Section | Range | Approx lines |
|---|---|---|
| Imports, constants, helpers | 1–213 | 213 |
| Component start, state, hooks | 214–1535 | 1300 |
| `<Tabs>` shell | 1536–1540 | 5 |
| Tab: **Grade Entry** | 1542–2428 | 886 |
| Tab: **Class Analysis** wrapper | 2430–2456 | 26 |
| Sub-tab: Overview | 2466–2911 | 445 |
| Sub-tab: Bands/Distribution | 2914–3435 | 521 |
| Performance Dialog (modal) | 3437–~3700 | ~260 |
| Sub-tab: Trends | ~3700–~4800 | ~1100 |
| Sub-tab: Comparison | ~4800–~6300 | ~1500 |
| Sub-tab: Box Plot | ~6300–~7900 | ~1600 |
| Closing JSX + extras | 7900–7995 | 95 |
| Trailing `GRADE_COLORS` constant | 7996–end | 7 |

### AcademicPage (lines)

| Section | Range |
|---|---|
| Imports, types, helpers | 1–95 |
| Component start, state, hooks | 96–1521 |
| Top `<Tabs>` (Report Card / Grade Analysis) | 1522–1527 |
| Report Card section + nested Tabs (Grades / Behavior / Awards) | 1607–~2070 |
| Existing extracted modals already in use: `CertificateDialog`, `ReportCardDialog` |  |
| Grade Analysis section with 4 sub-tabs (Overview / Distribution / Trends / Comparison) | ~2100–~5590 |

So both pages already have well-defined sub-tab boundaries we can lift.

---

## Refactor plan (sequential, one PR per stage — you test between each)

### Stage A — Safety net first

1. Move the file-top constants (icons, color helpers, formatters, `calculateTotal`, `getLetterGrade`, `formatSavedAt`, `getSelectionColor`, `SELECTION_COLORS`, `GRADE_COLORS`, types) out of `TeacherAcademicPage.tsx` and into:
   - `src/pages/teacher/academic/constants.ts`
   - `src/pages/teacher/academic/helpers.ts`
   - `src/pages/teacher/academic/icons.tsx`
2. Same for `AcademicPage.tsx` → `src/pages/academic/{constants,helpers}.ts`.
3. **No JSX changes yet.** Pure extraction of pure-function helpers and constants. Trivial to review.

Expected result: ~300 lines removed from each page. No behavior change. You verify nothing broke.

### Stage B — TeacherAcademicPage: extract the 5 analysis sub-tabs

One sub-tab at a time, in this order (smallest/most isolated first):

1. **OverviewTab** → `src/pages/teacher/academic/tabs/OverviewTab.tsx`
2. **BandsTab** → `BandsTab.tsx` (plus the Performance Dialog moves with it since they're tightly coupled)
3. **TrendsTab** → `TrendsTab.tsx`
4. **ComparisonTab** → `ComparisonTab.tsx`
5. **BoxPlotTab** → `BoxPlotTab.tsx`

Each extraction follows the exact same recipe:

```text
1. Cut the <TabsContent value="..."> JSX block.
2. Identify every variable/handler/state setter it reads.
3. Create the new component file with a props interface listing exactly those values.
4. In TeacherAcademicPage, replace the JSX with <OverviewTab {...overviewProps} />.
5. You reload the page and click through that tab to confirm it renders identically.
```

We do NOT lift state into the sub-components. State stays in the parent. Sub-components are dumb render targets receiving already-computed values. This is the safest shape.

After Stage B: TeacherAcademicPage drops from ~8000 to roughly ~3000 lines.

### Stage C — TeacherAcademicPage: extract Grade Entry

Same recipe applied to the Grade Entry tab (~900 lines) → `src/pages/teacher/academic/tabs/GradeEntryTab.tsx`. After this, the page itself is roughly ~2000 lines: state, data loading, derived values, and a small JSX shell that just composes the sub-tabs.

### Stage D — Optional: extract the data hook

If Stage B/C goes smoothly, we can move the large block of `useEffect`/data-loading/derived-state out of the component into `useTeacherAcademicData()`. **Riskier** — touches data flow rather than JSX. Worth doing only if maintenance pain remains.

### Stage E — AcademicPage (parent side), same pattern

Apply Stages A–C to the parent `AcademicPage.tsx`:
- `src/pages/academic/tabs/ReportCardTab.tsx`
- `src/pages/academic/tabs/GradesTab.tsx` / `BehaviorTab.tsx` / `AwardsTab.tsx`
- `src/pages/academic/tabs/AnalysisOverviewTab.tsx`, `AnalysisDistributionTab.tsx`, `AnalysisTrendsTab.tsx`, `AnalysisComparisonTab.tsx`

---

## What we explicitly will NOT do

- **No logic changes.** No "while we're here, this useEffect could be simplified." Pure cut-and-paste of JSX with prop wiring.
- **No deduplication across teacher/parent pages.** They look similar but their data shapes and permissions differ; merging them is a separate, riskier project.
- **No state lifted into sub-components.** Parent retains all `useState`, `useQuery`, and handlers.
- **No prop drilling cleanup** (e.g. context, reducers). That's optimisation, not refactor.

---

## Risk controls

- **One stage per round.** I finish Stage A, you test, you say continue. Then Stage B sub-tab 1, you test, continue. We do not batch.
- **Diff verification per extraction**: after each cut, I'll re-read the new file and the surrounding parent to confirm every referenced symbol is in the props list. Missing references show up as TypeScript errors on save — caught instantly.
- **Suspense fallback already in place** from the earlier lazy-loading work, so a broken sub-tab won't blank the whole app.
- **If any stage misbehaves, we revert just that stage.** Each is independent.

---

## How long this takes

- Stage A (both pages): one round.
- Stage B (5 sub-tabs): five rounds.
- Stage C: one round.
- Stage E (parent page): three rounds.

Total ~10 careful rounds. We can stop at any point — even just Stage A + Stage B sub-tab 1 already substantially improves readability.

I recommend starting with Stage A on both pages in this round, since it's the lowest-risk and gives us cleaner files to navigate for everything that follows.
