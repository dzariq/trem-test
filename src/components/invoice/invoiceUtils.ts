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
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  switch (status) {
    case "paid":
      return { label: "Paid", variant: "secondary" };
    case "pending_payment":
      return { label: "Outstanding", variant: "destructive" };
    case "draft":
      return { label: "Draft", variant: "outline" };
    case "cancelled":
      return { label: "Cancelled", variant: "outline" };
  }
}