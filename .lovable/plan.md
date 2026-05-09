# Teacher Academic Page – Typography & Color Cleanup

Tighten the visual design of the grading entry view: standardize the type scale, neutralize colored backgrounds, and replace the green Total Score panel with a clean container.

## Scope
File: `src/pages/teacher/TeacherAcademicPage.tsx` (grading entry UI block, ~lines 1943–2200).

## 1. Study Recommendation card
- Title "Study Recommendation": change from `text-xs font-semibold text-amber-700` → `text-sm font-semibold text-foreground` (black). Keep amber icon circle as the only accent.
- Placeholder text in textarea: keep size `text-sm` but remove italic styling override if any (placeholder is italic globally — leave default; just ensure copy is consistent).
- "Class-wide" badge: keep amber outline (already standardized accent).
- Counter `0/300` and "Save" button: leave structurally, just align to the new type scale (`text-xs` muted).

## 2. Student row header (collapsed state)
- Student name: keep `text-sm font-semibold text-foreground` ✓ (already consistent).
- "Not graded": already red ✓. Keep `text-xs`, remove any italic.
- Total badge on right: keep.

## 3. Expanded student card — Total Score panel (the light-green block)
Replace the `bg-accent/50` (which renders light green in this theme) with a neutral container:
- Container: `rounded-lg border border-border bg-card p-3` (no tinted background).
- "Total Score" label: `text-xs font-medium text-muted-foreground uppercase tracking-wide`.
- Score value: keep `text-2xl font-bold text-foreground`, "/100" muted.
- Letter grade: render as a circular chip on the right with the grade's accent color as a soft tint (not a heavy badge). Use `w-12 h-12 rounded-full` with `bg-{grade}-50 text-{grade}-700 border border-{grade}-200` style (matches the C-circle look in the screenshot but inside a clean white container).

## 4. Comment sections (Report Card / Authentic / Individual Study Recommendation)
Standardize the three section headers to one rule:
- Label: `text-sm font-semibold text-foreground` (black, not colored).
- Optional small meta tag (e.g. "(Internal)", "Individual", "Class-wide"): `text-[10px]` muted or kept as outline badge — one style only.
- Textareas: remove tinted backgrounds (`bg-emerald-50/50`, `bg-red-50/50`, `bg-amber-50/50`) and colored borders → use neutral `border-border bg-background`. Keep placeholder default (no italic override).
- Character counters: unify to `text-[10px] text-muted-foreground` right-aligned.

The "Class recommendation (shown to all)" inline preview box stays amber-tinted (it's a callout, not a field) but text drops to `text-[11px] text-foreground` with a muted label.

## 5. Type scale (applied across the section)
Single, consistent scale:
- Section/field title: `text-sm font-semibold text-foreground`
- Body / input text: `text-sm text-foreground`
- Meta / counters / hints: `text-[10px]` or `text-xs` `text-muted-foreground`
- No italics anywhere except the default placeholder italic from the Textarea component (already global).

## 6. Color discipline
- Headings & labels → black (`text-foreground`).
- Accent color reserved only for: the small icon chip next to "Study Recommendation", outline badges (Class-wide / Individual / Internal), letter-grade chip, and "Not graded" red.
- No colored fills on textareas or score panel.

## Out of scope
- No logic changes (state, save handlers, validation untouched).
- Other page sections (Behavior, Awards, Analysis tabs) are not modified.

## Technical notes
All edits are className/markup adjustments inside `TeacherAcademicPage.tsx`. No new dependencies, no schema changes, no new components.
