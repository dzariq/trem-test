## Goal

Make non-CCA calendar event chips render as a **solid color block with white text**, using the exact hex palette already mirrored from the admin web project (`collinz-app-school`). CCA chips stay untouched.

## Current state

- Event chips currently render translucent (15% alpha bg, colored text, 40% alpha border) via `getEventChipStyle(hex)` in `src/lib/calendarTaxonomy.ts`.
- Colors already come from `resolveEventHex` which mirrors the admin project's taxonomy hex values (Exams `#dc2626`, Holidays `#22c55e`, Events `#8b5cf6`, Staff/Admin `#f97316`, Due `#f43f5e`, Students `#06b6d4`, Parents `#ec4899`, plus subtype variants). So the palette is already correct — only the chip rendering needs to change.
- CCA chips use a separate `colorClass` (Tailwind class from `getCcaTypePillColor`) — they will be left alone.

## Change

Update `getEventChipStyle` in `src/lib/calendarTaxonomy.ts`:

```ts
export const getEventChipStyle = (hex: string): React.CSSProperties => {
  const safe = hex || DEFAULT_EVENT_COLOR;
  return {
    backgroundColor: safe,
    color: "#ffffff",
    borderColor: safe,
  };
};
```

This automatically applies to all three places that consume it (MonthGridCalendar chips, TimeGridCalendar all-day + timed blocks, UpcomingEventsSection pills) — all of which already gate on `kind === "event"`, so CCA chips are unaffected.

No other files need to change.
