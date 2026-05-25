## Invoice Drawer — Status & Period Pill Polish

Update the status row at the top of the invoice details drawer (`src/components/invoice/InvoiceDetailsSheet.tsx`) so both tags read as prominent pills.

### Changes

1. **Status pill (Paid / Outstanding)** — replace the shadcn `Badge` variant-based styling with explicit color classes so:
   - `paid` → solid **green** pill (`bg-emerald-600 text-white`)
   - `pending_payment` → solid **red** pill (`bg-destructive text-destructive-foreground`)
   - `draft` / `cancelled` → muted neutral pill
   - All use `rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide` for the prominent pill shape.

2. **Period pill (e.g. `2026-T2`)** — currently plain muted text. Convert to a pill matching the status pill's footprint:
   - Neutral style: `rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-foreground`.
   - Keeps it readable but visually balanced opposite the status pill.

3. **Helper update** — extend `statusLabel` in `src/components/invoice/invoiceUtils.ts` to return a `className` string (or replace `variant` with explicit Tailwind classes) so the color mapping lives in one place and can be reused by `InvoiceCard` later if desired.

### Out of scope
- No change to `InvoiceCard` list styling in this pass (can mirror later if you want consistency).
- No changes to amounts, items, or layout below the header row.