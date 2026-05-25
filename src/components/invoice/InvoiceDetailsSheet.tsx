import { format, parseISO } from "date-fns";
import { ExternalLink, Receipt } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ParentInvoice } from "@/data/invoices";
import { formatMoney, statusLabel } from "./invoiceUtils";

interface Props {
  invoice: ParentInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsSheet({ invoice, open, onOpenChange }: Props) {
  if (!invoice) return null;

  const statusInfo = statusLabel(invoice.status);
  const hasDates = Boolean(invoice.invoiceDate || invoice.dueDate);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0, 0.9, 1]}
      defaultSnapPoint={0.9}
      title={
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <span>{invoice.invoiceNumber || "Invoice"}</span>
        </div>
      }
    >
      <div className="space-y-5 px-4 pb-6">
        {/* Status + period */}
        <div className="flex items-center justify-between">
          <Badge variant={statusInfo.variant} className="border-0">
            {statusInfo.label}
          </Badge>
          {invoice.periodKey && (
            <span className="text-xs text-muted-foreground">{invoice.periodKey}</span>
          )}
        </div>

        {invoice.bukkuUrl && (
          <Button
            className="w-full"
            onClick={() => window.open(invoice.bukkuUrl!, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View full invoice
          </Button>
        )}

        {/* Amounts */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 bg-slate-100">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total amount</span>
            <span className="font-medium text-foreground">
              {formatMoney(invoice.amount, invoice.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium text-emerald-600">
              {formatMoney(invoice.paidAmount, invoice.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span className="text-muted-foreground">Outstanding</span>
            <span
              className={
                "font-semibold " +
                (invoice.outstandingAmount > 0 ? "text-destructive" : "text-foreground")
              }
            >
              {formatMoney(invoice.outstandingAmount, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Dates */}
        {hasDates && <div className="grid grid-cols-2 gap-3 text-sm">
          {invoice.invoiceDate && (
            <div>
              <p className="text-xs text-muted-foreground">Invoice date</p>
              <p className="font-medium text-foreground">
                {format(parseISO(invoice.invoiceDate), "d MMM yyyy")}
              </p>
            </div>
          )}
          {invoice.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="font-medium text-foreground">
                {format(parseISO(invoice.dueDate), "d MMM yyyy")}
              </p>
            </div>
          )}
        </div>}

        {/* Line items */}
        {invoice.lineItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Items
            </h4>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {invoice.lineItems.map((it, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-slate-100">
                  <p className="text-sm text-foreground flex-1">{it.description}</p>
                  <p
                    className={
                      "text-sm font-medium tabular-nums " +
                      (it.amount < 0 ? "text-emerald-600" : "text-foreground")
                    }
                  >
                    {formatMoney(it.amount, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}