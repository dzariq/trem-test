## Goal

Tighten the Box Plot tab visuals: unify the gray-shade containers and give the "All Subjects / Mid-Year / Year-End" tag chips real color so the page stops looking flat.

## Problem (from your screenshots)

Three different gray tones are stacked back-to-back inside the Box Plot tab:

| Element | Current class | Tone |
|---|---|---|
| Student / Subject toggle wrapper | `bg-muted` | darker gray |
| Start Year / End Year wrapper | `bg-muted/50` | lighter gray |
| Subject + Exam tag chips (`Badge`) | `bg-muted text-muted-foreground` | mid gray |

…and the chips themselves are gray on gray, which is the dullest part of the page.

## What I'll change

### 1. Unify gray container shades

In `src/pages/teacher/TeacherAcademicPage.tsx` (Box Plot tab, ~lines 5232–5299):

- View Mode toggle wrapper → change `bg-muted` to `bg-muted/50` so it matches the Year Range card.
- Both wrappers also get the same padding rhythm (`p-1.5` / `p-2`) and `rounded-lg` is already consistent. Result: one neutral gray surface tone reused twice, no more two-tone banding.

### 2. Colorize the tag chips

Replace the gray `Badge variant="secondary" bg-muted text-muted-foreground` chips with semantic color pills, matching the rest of the app's badge palette.

Subject chips (subject mode + student mode):
- Background: `bg-blue-50` / dark mode `dark:bg-blue-950/40`
- Text: `text-blue-700` / `dark:text-blue-300`
- Border: `border border-blue-200/60`
- "+N more" overflow chip uses `bg-slate-100 text-slate-600` so it visually recedes.

Exam-type chips:
- Mid-Year → `bg-amber-50 text-amber-700 border-amber-200/60`
- Year-End → `bg-emerald-50 text-emerald-700 border-emerald-200/60`
- "All Exams" placeholder shows both pills (current behavior) but each in its own color above.

Same treatment is mirrored in the Subject mode block further down (~5502+) so both modes look consistent.

### 3. Light polish (no behavior change)

- The `Popover` trigger button keeps `variant="outline"` but gains `bg-background` so it doesn't visually merge with the gray card behind it.
- The "to" separator in the Year Range row gets `font-medium` so it stops looking like an afterthought.

## Out of scope

- No changes to data, state, or filter logic.
- No changes to other Class Analysis tabs (Overview, Bands, Trends, Compare).
- No changes to charts or computed values.
- No new design tokens — colors come from existing Tailwind palette already used elsewhere in the page (Bands "Open/Closed", Rising/Falling subjects, etc.).

## Files touched

- `src/pages/teacher/TeacherAcademicPage.tsx` only — Box Plot tab block.
