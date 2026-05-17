# Calendar module updates & audit

## 1. Rename "Highlights" tab to "Events"
- `src/lib/calendarFilters.ts` → in `UPCOMING_TABS`, change the `events` tab `label` from `"Highlights"` to `"Events"`.
- No key change (`value` stays `"events"`), so no other code is affected.

## 2. Reorder tabs to: Events · CCA · Exams · Holidays
- `src/lib/calendarFilters.ts` → reorder `UPCOMING_TABS` to `[events, cca, exams, holidays]`.
- `src/components/calendar/UpcomingEventsSection.tsx` already iterates over `UPCOMING_TABS`, so order updates automatically. Active-tab color mapping (purple/red/green/primary) is keyed by `tab.value` and stays correct.

## 3. Restyle CCA pills in month grid to match screenshot 2
Target: distinct pill shape so CCA stands out from event chips.

- `src/components/calendar/MonthGridCalendar.tsx` → in the chip render (around lines 330–344), branch on `item.kind === "cca"`:
  - Use a **fully rounded** pill (`rounded-full`), thin **border with matching color**, light tinted background, slightly taller (`h-[18px]`), with a small leading **Users icon** (`lucide-react` `Users`, `h-2.5 w-2.5`) — mirrors the "Indoor Clubs / Education FT / Art Club" style.
  - Keep regular events as the current squared chip (`rounded-[3px]`).
- Re-use `getCcaTypeColor(category)` but split it (or wrap it) so we get a border-color + soft bg variant for the pill, instead of solid fill. Implementation detail: extend `getCcaTypeColor` in `src/components/cca/CcaTypeTabs.tsx` with an optional `variant: "solid" | "outline"` (default solid to preserve existing call sites), and use `"outline"` from the month grid.
- Apply the same outline-pill treatment in `src/components/calendar/TimeGridCalendar.tsx` where CCA chips render, so day/week views stay consistent.

## 4. Calendar backend audit
Read-only verification against the current Supabase schema to catch drift from recent backend updates. No code changes unless an issue is found; fixes will be listed and confirmed before applying.

Checks:
- `calendar_events` table — columns referenced by `src/data/calendar.ts` loader (title, start/end date, all_day, event_type, event_category, tags, location, campus_code, visibility/role fields) still exist and match types.
- `cca_sessions` + `cca_activities` + `school_locations` joins used by `src/hooks/useCcaSessionsCalendar.ts` and `src/hooks/useUpcomingCcaSessions.ts` — column names (`session_date`, `start_time`, `end_time`, `location`, `location_id`, `custom_title`, `is_cancelled`, `cca_activities.campus_code`, `cca_activities.category`).
- `cca_activity_types` used by `src/hooks/useCcaTypes.ts` (`name`, `sort_order`, `is_active`, `campus_code`).
- Campus scoping filter `campus_code.eq.X,campus_code.is.null` still matches the parent's campus context.
- RLS: parent role can `SELECT` from `calendar_events`, `cca_sessions`, `cca_activities`, `cca_activity_types`, `school_locations`. Use `supabase--linter` + a few `supabase--read_query` smoke selects.
- Tag visibility against `PARENT_HIDDEN_TAGS` in `src/types/calendarTags.ts` — confirm any new event types added on the backend are categorised (otherwise they'll silently fall through filters).

Deliverable: a short audit report in chat listing ✅/⚠️ per check; any ⚠️ items get a follow-up patch.

## Out of scope
- No changes to event detail sheets, filter sheet, or pull-to-refresh behaviour.
- No migration unless the audit surfaces something broken.
