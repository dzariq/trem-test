# Invoice module for parents

## What exists already (verified in Supabase)

- **`student_invoices`** — synced from Bukku. Key fields: `bukku_contact_id`, `bukku_invoice_id`, `type` (`fees` / `others`), `status` (`paid`, `pending_payment`, `draft`, `cancelled(CN)`), `invoice_date`, `period_key` (e.g. `2027-T1`), `payment_amount`, `outstanding_amount`, `url` (Bukku short link), and a rich `content` jsonb that holds `amount`, `balance`, invoice number, line items, due dates, etc.
- **`bukku_contacts`** maps `student_id ↔ bukku_contact_id`.
- **RLS** already lets parents read invoices for any of their linked children (via `student_guardians`). No DB migration needed.

## Scope

Read-only parent view. No payment integration, no admin features.

## What we'll build

### 1. Navigation
- Add **Invoice** (Receipt icon) right after Calendar in `BottomNavigation.tsx`. Five tabs comfortably fit at 390px; if the homework flag is on too, we'll let it scroll/condense the labels. New route `/parent/invoice` registered in `src/App.tsx`.

### 2. Data layer — `src/data/invoices.ts`
- `listInvoicesForStudent(studentId)` — joins `bukku_contacts → student_invoices`, returns a normalized shape:
  - `id, invoiceNumber, periodKey, invoiceDate, dueDate, status, type, amount, paidAmount, outstandingAmount, currency, lineItems[], bukkuUrl`
- Filter out `draft` and `cancelled(CN)` from the parent view by default (toggleable).
- Amounts: prefer `outstanding_amount` / `payment_amount` columns, fall back to `content.balance` / (`content.amount - content.balance`).

### 3. Hook — `src/hooks/useStudentInvoices.ts`
- React Query hook keyed by `selectedStudentId`. Reuses the global `useStudentSelection` pattern (same as Homework / Academic pages).

### 4. Page — `src/pages/InvoicePage.tsx`

Layout (mobile-first, 390px):

```text
┌──────────────────────────────┐
│  ← Invoices                  │
├──────────────────────────────┤
│ [👥 Student ▾]               │  ← reuses linkedStudents selector
├──────────────────────────────┤
│  ┌── Summary card ─────────┐ │
│  │ Outstanding   RM 7,138  │ │  ← sum of pending_payment.outstanding
│  │ Paid this year  RM 12k  │ │
│  │ 3 invoices · 1 unpaid   │ │
│  └─────────────────────────┘ │
├──────────────────────────────┤
│ [All] [Outstanding] [Paid]   │  ← status pills
├──────────────────────────────┤
│  GL-IV2701/0006   ● Pending  │
│  Term 1 2027 · Due 7 Jan     │
│  RM 7,138.30                 │
│  [View on Bukku ↗]           │
│  ────────────────────────    │
│  GL-IV2604/0012   ✓ Paid     │
│  Term 4 2026 · Paid 12 Oct   │
│  RM 6,608.30                 │
└──────────────────────────────┘
```

- **Summary card**: total outstanding, total paid YTD, invoice count, overdue count (status = pending_payment AND `term_items[0].date < today`).
- **List card**: tap to open a bottom sheet with the full line-item breakdown from `content.form_items` (description, amount), plus a "View on Bukku" button that opens `url` in a new tab via `openExternal` for native compatibility.
- Empty state: "No invoices yet for {student name}".
- Handles students with no `bukku_contacts` row (show "Billing not set up — contact the school office").

### 5. Notifications (out of scope for this round)
We can add an automatic notification when a new `pending_payment` invoice appears in a follow-up — flag this and skip for now.

## Files touched

- `src/components/layout/BottomNavigation.tsx` — add Invoice item
- `src/App.tsx` — add `/parent/invoice` route
- `src/data/invoices.ts` *(new)* — query + normalizer
- `src/hooks/useStudentInvoices.ts` *(new)*
- `src/pages/InvoicePage.tsx` *(new)*
- `src/components/invoice/InvoiceCard.tsx` *(new)*
- `src/components/invoice/InvoiceDetailsSheet.tsx` *(new)* — uses standard `BottomSheet` (75vh, draggable)

## Open questions (will assume defaults if not raised)

1. **Drafts** — hide from parents (default). Confirm?
2. **Currency** — always RM in the data; we'll display with `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })`.
3. **Bukku link** — open externally (defaults to yes, since Bukku has its own auth).
