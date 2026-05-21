## Goal

In the mobile app's Month grid (and the "What's Coming Up" badges), most event chips currently render in grey because their DB `event_category` doesn't match our hard-coded tag enum (e.g. "PH 7", "Y1-8 MYE", "TSM/Workshop", "Term 2 Start", "Open Day 3"). The reference admin project (`collinz-app-school`) renders these in saturated category colors. Mirror that color system here so chips look the same across both apps.

## Color palette to mirror (from `collinz-app-school/src/lib/calendarTaxonomy.ts`)

| Group | Color |
|---|---|
| Exams | `#dc2626` red |
| Holidays | `#22c55e` green |
| Events | `#8b5cf6` purple |
| Staff & Admin | `#f97316` orange |
| Due Dates | `#f43f5e` rose |
| Students | `#06b6d4` cyan |
| Parents | `#ec4899` pink |

Plus the per-subtype shades (e.g. Cambridge `#991b1b`, Replacement PH `#16a34a`, Internal Event `#a78bfa`, etc.) for finer matching when a known subtype is detected.

## Changes

1. **`src/lib/calendarTaxonomy.ts` (new)** — port the reference's `CALENDAR_TAXONOMY`, `getSubtypeColor`, and `getCategoryGroupColor` (the keyword-based fuzzy mapper that handles "exam/cambridge/igcse/checkpoint", "holiday/break", "event/trip/competition/open day", "meeting/admin/staff/bog/bts", "due/deadline", "student…", "parent/ptc/family"). Same hex values as the reference for visual parity.

2. **`src/lib/calendarCategorySubtypes.ts`** — extend `mapDbToCategory` so keyword-based names that come from the DB `event_categories.name` (and not just our enum slugs) resolve to a `TagCategory`. In particular: titles/categories starting with "PH"/containing "public holiday" → holidays; "MYE"/"YEE"/"Cambridge"/"IGCSE"/"Checkpoint" → exams; "TSM"/"AHM"/"OHM"/"meeting" → staff-admin; "Open Day"/"BTS"/"Term … Start"/"Orientation" → events / staff-admin as appropriate.

3. **`src/lib/calendarUtils.ts`** — rework `getEventBadgeColor` (and add `getEventBadgeHex`) so it returns:
   - A real hex from `event_categories.color` when present (new: read it from the row, see step 4), else
   - The taxonomy subtype color from `getSubtypeColor(tag/title)`, else
   - The group color from `getCategoryGroupColor(category)` (the fuzzy matcher), else
   - The current default.
   Replace the current pale `bg-*-200 text-*-900` Tailwind output with a saturated chip style:
   - For Month-grid chips: inline `style={{ backgroundColor: hex, color: readableTextColor(hex) }}` with a translucent fill (`hex + "33"` for background, full hex for text/border) so chips look like the reference's pill style rather than muted grey rectangles.
   - For category pills/badges elsewhere: keep the Tailwind class API but back it by the new resolver so unmapped categories no longer fall through to `bg-muted`.

4. **`src/data/calendar.ts`** — extend `mapCalendarRow` to also read `row.event_categories?.color` (if the join is present) and surface it as `categoryColor` on `UpcomingEvent`. Update the Supabase select used by `listCalendarEvents` / `listUpcomingEvents` to include `event_categories(name,color)`. This gives admin-defined colors first-class priority and matches what the reference's "0. Prefer FK color" branch does.

5. **`src/components/calendar/MonthGridCalendar.tsx`** — switch the chip from `colorClass` (Tailwind) to a resolved hex via the new helper. CCA chips keep their existing yellow/orange/light-yellow palette (already aligned with the reference's `CCA_COLOR_BY_KIND`). Non-CCA chips render with the new saturated style. Ensure text stays legible (use `getReadableTextColor` helper ported from the reference's `pastelColors.ts`).

6. **`src/components/calendar/UpcomingEventsSection.tsx`** and any other place using `getEventBadgeColor` — pass through the new resolver so list-view badges match the grid chips.

7. **Out of scope:** CCA color logic (already correct), filter sheet pill colors (already saturated), holiday detail sheet styling, dark-mode tweaks beyond what the new hex+alpha already supports.

## Verification

- Reload `/calendar` and confirm: "PH 7" green, "Term 2 Start" orange/blue, "Y1-8 MYE" red, "TSM/Workshop" orange, "Open Day 3" purple, "Comm…" / "Art Club" / "Board" remain yellow CCA pills.
- Check `/teacher/calendar` (admin-like role) renders the same colors.
- Confirm no grey chips remain for events whose category/title matches a taxonomy keyword.
