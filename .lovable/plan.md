## Goal
In the month grid calendar, CCA chips currently show an oversized icon that pushes the title onto a 2nd row. Make the icon match the text size (single row), and let chip text run to the cell edge — clipping mid-letter if needed — instead of wrapping.

## Changes (single file: `src/components/calendar/MonthGridCalendar.tsx`)

1. **Smaller CCA icon**
   - Change `<Icon className="h-2.5 w-2.5 ...">` to `h-2 w-2` (≈8px, same as chip text).
   - Tighten the chip flex container (`gap-0.5` instead of `gap-1`) so icon + text fit on one line.

2. **Single-row, hard-clip text for ALL chips (CCA + events)**
   - Replace the current `maxHeight: 22px / lineHeight: 11px / wordBreak: break-word` (which still wraps to 2 lines) with a true single-line clip:
     - `whiteSpace: "nowrap"`
     - `overflow: "hidden"`
     - `textOverflow: "clip"` (no ellipsis)
   - Remove `break-words` class on the title span.
   - Allow the chip itself to clip past its visual edge by keeping `overflow-hidden` on the chip wrapper so half-letters get cut cleanly at the cell boundary.

3. **Chip height**
   - Reduce `min-h-[12px]` chip min-height is already fine; ensure only 1 line renders (~11px line-height), so each day cell can fit more chips within the existing `maxChipsPerDay`.

## Out of scope
- No color changes, no event-chip-style changes, no logic/data changes.
- CCA Connect (separate cards elsewhere) untouched.
