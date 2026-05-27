## Problem

Event chips render with green-blue / sky-blue colors instead of the spec'd purple shades (e.g. Open Day, External Event, Field Trip).

Root cause: `resolveEventHex` in `src/lib/calendarTaxonomy.ts` prioritises the `event_categories.color` value from the DB (`fkColor`) over the in-code subtype palette. The DB rows were seeded with the wrong hex codes (Open Day = `#0ea5e9` sky blue, Field Trip = `#14b8a6` teal, Internal/External Event = indigos, etc.), so the correct in-code purple palette is overridden at runtime.

Source of truth (from the reference project `collinz-app-school` → `.lovable/plan.md`) confirms the intended palette is fully purple for the Events group and re-tones several other categories too.

## Fix

Add one Supabase migration that updates `public.event_categories.color` to match the spec. No frontend code changes — the taxonomy file already has the correct values; we just need the DB to agree.

### Color updates

```
Events (purple)
  Special Event (Major)              #8b5cf6 → #7c3aed
  Internal Event                     #6366f1 → #8b5cf6
  External Event                     #4f46e5 → #6d28d9
  Open Day                           #0ea5e9 → #a78bfa
  Field Trip                         #14b8a6 → #5b21b6

Exams (red)
  Cambridge Exam                     #991b1b → #b91c1c

Staff & Admin (orange)
  Admin Meeting                      #6b7280 → #ea580c
  Board of Governors Meeting (BOG)   #374151 → #c2410c
  Back to School (BTS)               #3b82f6 → #fdba74

Parents (pink)
  Parent–Teacher Conference (PTC)    #fbbf24 → #ec4899
  Parent Enrichment Workshop         #f59e0b → #db2777
  Family Event (Parents Welcome)     #d97706 → #be185d
```

All other rows already match spec and are left untouched.

### Out of scope

- No changes to `calendarTaxonomy.ts`, MonthGridCalendar, TimeGridCalendar, or filter UI.
- No changes to CCA color logic.
