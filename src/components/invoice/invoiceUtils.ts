import type { InvoiceStatus } from "@/data/invoices";

export function formatMoney(amount: number, currency: string = "MYR"): string {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function statusLabel(
  status: InvoiceStatus
): { label: string; className: string } {
  const base = "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border-0";
  switch (status) {
    case "paid":
      return { label: "Paid", className: `${base} bg-emerald-600 text-white hover:bg-emerald-600` };
    case "pending_payment":
      return { label: "Outstanding", className: `${base} bg-destructive text-destructive-foreground hover:bg-destructive` };
    case "draft":
      return { label: "Draft", className: `${base} bg-muted text-muted-foreground` };
    case "cancelled":
      return { label: "Cancelled", className: `${base} bg-muted text-muted-foreground` };
  }
}