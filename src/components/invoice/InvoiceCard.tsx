import { format, parseISO } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParentInvoice } from "@/data/invoices";
import { formatMoney, statusLabel } from "./invoiceUtils";

interface Props {
  invoice: ParentInvoice;
  onClick: () => void;
}

export function InvoiceCard({ invoice, onClick }: Props) {
  const status = statusLabel(invoice.status);
  const displayDate = invoice.dueDate || invoice.invoiceDate;
  const isOverdue =
    invoice.status === "pending_payment" &&
    invoice.dueDate &&
    new Date(invoice.dueDate).getTime() < Date.now();

  return (
    <Card
      className="border-border cursor-pointer hover:bg-accent/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {invoice.invoiceNumber || "Invoice"}
            </span>
            {invoice.periodKey && (
              <span className="text-xs text-muted-foreground shrink-0">
                · {invoice.periodKey}
              </span>
            )}
          </div>
          <Badge variant={status.variant} className="border-0 shrink-0">
            {isOverdue ? "Overdue" : status.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {displayDate
              ? `${invoice.dueDate ? "Due " : ""}${format(parseISO(displayDate), "d MMM yyyy")}`
              : "—"}
          </div>
          <div className="flex items-center gap-1">
            <span
              className={
                "text-base font-semibold tabular-nums " +
                (invoice.status === "pending_payment"
                  ? "text-destructive"
                  : "text-foreground")
              }
            >
              {formatMoney(
                invoice.status === "pending_payment"
                  ? invoice.outstandingAmount
                  : invoice.amount,
                invoice.currency
              )}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}