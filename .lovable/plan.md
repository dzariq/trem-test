# Visa page refresh

## Goals
1. Only show people who actually have visa info.
2. Sort "has visa" entries before "passport only" entries.
3. Replace the grey passport container with a light-blue treatment.
4. Tighten the overall layout so it reads cleaner on mobile.

## Behavior changes (`src/pages/VisaPage.tsx` only — no data/RPC changes)

### Filtering
- **Guardians**: hide any parent bundle where `records.length === 0 && periods.length === 0` AND there is no passport info (`nationality / passport_number / passport_expiry_date` all empty). A parent with only a passport but no visa record is also hidden — per request "only show available visa details".
- **Students**: same rule — hide students with no `record` and no `periods` (passport-only students hidden).
- If nothing remains for a section, hide the section header entirely.
- Empty-state card shows when both sections are empty.

### Sorting
- Within Guardians: `(has periods or record) ? 0 : 1` first, then `isSelf`, then `is_primary_contact`, then name.
- Within Students: students with `periods.length > 0 || record` first, then alphabetical by name.

### Passport card restyle
- Swap `bg-muted/30 border-border` → light-blue tokens: `bg-sky-50/70 border-sky-100`.
- Icon chip becomes `bg-sky-100 text-sky-700`.
- Section eyebrow label uses `text-sky-700`.
- Keep typography/spacing; add subtle `rounded-xl` consistency.

### Layout / UX polish
- Group each person into a single bordered "person card" wrapper (`rounded-2xl border bg-card p-3 space-y-3`) so name + passport + visa periods read as one unit instead of floating fragments.
- Person header row: avatar circle with initials (sky-tinted) · name · `You` / `Primary` pills · count badge ("2 passes" / "Passport only").
- Visa period cards stay as-is but lose the outer card border when nested (use `bg-background border-sky-100` for softer nesting).
- Section headers gain a small count: "Guardians · 2", "Students · 1".
- Tighten vertical rhythm: `space-y-4` between people, `space-y-5` between sections.
- Top "Visa records" info banner kept; copy unchanged.

## Out of scope
- No SQL / RPC / RLS changes.
- No changes to `src/data/visa.ts`.
- No changes to student-profile dialog or other pages.

## Files touched
- `src/pages/VisaPage.tsx` (single file)
