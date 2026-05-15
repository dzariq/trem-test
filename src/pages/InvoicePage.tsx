import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useStudentInvoices } from "@/hooks/useStudentInvoices";
import { InvoiceCard } from "@/components/invoice/InvoiceCard";
import { InvoiceDetailsSheet } from "@/components/invoice/InvoiceDetailsSheet";
import { formatMoney } from "@/components/invoice/invoiceUtils";
import type { ParentInvoice } from "@/data/invoices";
import { cn } from "@/lib/utils";

type Filter = "all" | "outstanding" | "paid";

export default function InvoicePage() {
  const { selectedStudentId, selectedStudent } = useStudentSelection();
  const { invoices, isLoading, error } = useStudentInvoices(selectedStudentId);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<ParentInvoice | null>(null);

  const summary = useMemo(() => {
    const outstanding = invoices
      .filter((i) => i.status === "pending_payment")
      .reduce((sum, i) => sum + i.outstandingAmount, 0);
    const thisYear = new Date().getFullYear();
    const paidYTD = invoices
      .filter(
        (i) =>
          i.status === "paid" &&
          i.invoiceDate &&
          new Date(i.invoiceDate).getFullYear() === thisYear
      )
      .reduce((sum, i) => sum + i.paidAmount, 0);
    const unpaidCount = invoices.filter((i) => i.status === "pending_payment").length;
    return { outstanding, paidYTD, unpaidCount, total: invoices.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (filter === "outstanding") return invoices.filter((i) => i.status === "pending_payment");
    if (filter === "paid") return invoices.filter((i) => i.status === "paid");
    return invoices;
  }, [invoices, filter]);

  const currency = invoices[0]?.currency || "MYR";

  return (
    <AppLayout>
      <AppHeader title="Invoices" showChildSelector />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              Couldn't load invoices. {error.message}
            </CardContent>
          </Card>
        )}

        {/* No student linked yet */}
        {!isLoading && !error && !selectedStudentId && (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">Select a child to view invoices.</p>
            </CardContent>
          </Card>
        )}

        {/* Loaded */}
        {!isLoading && !error && selectedStudentId && (
          <>
            {/* Summary */}
            <Card className="border-border bg-gradient-to-br from-card to-accent/30">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total outstanding
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold tabular-nums mt-1",
                      summary.outstanding > 0 ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {formatMoney(summary.outstanding, currency)}
                  </p>
                  {selectedStudent && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      for {selectedStudent.name}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paid in {new Date().getFullYear()}
                    </p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatMoney(summary.paidYTD, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoices</p>
                    <p className="text-sm font-semibold text-foreground">
                      {summary.total}
                      {summary.unpaidCount > 0 && (
                        <span className="text-destructive font-normal">
                          {" "}· {summary.unpaidCount} unpaid
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filter pills */}
            {invoices.length > 0 && (
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "outstanding", label: "Outstanding" },
                    { key: "paid", label: "Paid" },
                  ] as { key: Filter; label: string }[]
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={filter === opt.key ? "default" : "outline"}
                    onClick={() => setFilter(opt.key)}
                    className="rounded-full"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}

            {/* List */}
            {invoices.length === 0 ? (
              <Card className="border-dashed border-2 border-muted">
                <CardContent className="p-8 text-center">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-base font-medium text-foreground mb-1">
                    No invoices yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Billing for {selectedStudent?.name || "this student"} hasn't been
                    set up, or no invoices have been issued.
                  </p>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No invoices match this filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    onClick={() => setActive(inv)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <InvoiceDetailsSheet
        invoice={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </AppLayout>
  );
}