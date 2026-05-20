import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Stamp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useHasVisaModule } from "@/hooks/useHasVisaModule";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyParentVisa,
  fetchMyChildrenVisa,
  pathwayLabel,
  statusMeta,
  formatDate,
  type ParentVisaPeriod,
  type StudentVisaPeriod,
  type ParentVisaRecord,
  type StudentVisaRecord,
} from "@/data/visa";

function StatusChip({ status }: { status: ParentVisaPeriod["status"] }) {
  const meta = statusMeta(status);
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", meta.className, meta.strike && "line-through")}>
      {meta.label}
    </Badge>
  );
}

function BondInsuranceLine({
  bond,
  provider,
  policyNo,
  insuranceExpiry,
}: {
  bond?: number | null;
  provider?: string | null;
  policyNo?: string | null;
  insuranceExpiry?: string | null;
}) {
  const items: string[] = [];
  if (bond != null) items.push(`Bond: RM ${Number(bond).toLocaleString()}`);
  if (provider) items.push(`Insurer: ${provider}${policyNo ? ` (${policyNo})` : ""}`);
  if (insuranceExpiry) items.push(`Insurance exp: ${formatDate(insuranceExpiry)}`);
  if (!items.length) return null;
  return (
    <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
      {items.map((t) => <div key={t}>{t}</div>)}
    </div>
  );
}

function PeriodCard({
  pathway,
  passNumber,
  issueDate,
  expiryDate,
  status,
  notes,
  bond,
  insuranceProvider,
  insurancePolicyNo,
  insuranceExpiry,
  strike,
}: {
  pathway: string;
  passNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: ParentVisaPeriod["status"];
  notes: string | null;
  bond?: number | null;
  insuranceProvider?: string | null;
  insurancePolicyNo?: string | null;
  insuranceExpiry?: string | null;
  strike?: boolean;
}) {
  return (
    <Card className="border-border">
      <CardContent className={cn("p-4 space-y-2", strike && "opacity-70")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-100">{pathway}</Badge>
            {passNumber && (
              <span className="text-xs font-mono text-muted-foreground">{passNumber}</span>
            )}
          </div>
          <StatusChip status={status} />
        </div>
        <div className={cn("text-sm text-foreground", strike && "line-through")}>
          <span className="text-muted-foreground">Validity:</span> {formatDate(issueDate)} → {formatDate(expiryDate)}
        </div>
        <BondInsuranceLine
          bond={bond}
          provider={insuranceProvider}
          policyNo={insurancePolicyNo}
          insuranceExpiry={insuranceExpiry}
        />
        {notes && <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{notes}</div>}
      </CardContent>
    </Card>
  );
}

export default function VisaPage() {
  const hasVisa = useHasVisaModule();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const parentQuery = useQuery({
    queryKey: ["visa", "parent", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: fetchMyParentVisa,
  });

  const childrenQuery = useQuery({
    queryKey: ["visa", "children", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: fetchMyChildrenVisa,
  });

  // Realtime invalidation for both period tables.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`visa-realtime-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_visa_periods" }, () => {
        queryClient.invalidateQueries({ queryKey: ["visa", "parent", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_visa_records" }, () => {
        queryClient.invalidateQueries({ queryKey: ["visa", "parent", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "student_visa_periods" }, () => {
        queryClient.invalidateQueries({ queryKey: ["visa", "children", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "student_visa_records" }, () => {
        queryClient.invalidateQueries({ queryKey: ["visa", "children", user.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  if (!hasVisa && !parentQuery.isLoading && !childrenQuery.isLoading) {
    return <Navigate to="/parent" replace />;
  }

  const loading = parentQuery.isLoading || childrenQuery.isLoading;
  const parentRecords: ParentVisaRecord[] = parentQuery.data?.records ?? [];
  const parentPeriods: ParentVisaPeriod[] = parentQuery.data?.periods ?? [];
  const children = childrenQuery.data ?? [];

  return (
    <AppLayout>
      <AppHeader title="Visa" showBack showNotifications />
      <div className="p-4 space-y-6 pb-24">
        <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <Stamp className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground">Visa records</div>
            <div className="text-xs text-muted-foreground">Read-only view of your immigration passes.</div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading visa records...
          </div>
        )}

        {!loading && parentRecords.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> My Visa
            </h2>
            {parentPeriods.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No issued periods on record yet.
                </CardContent>
              </Card>
            ) : (
              parentPeriods.map((p) => (
                <PeriodCard
                  key={p.id}
                  pathway={pathwayLabel(p.pathway)}
                  passNumber={p.pass_number}
                  issueDate={p.issue_date}
                  expiryDate={p.expiry_date}
                  status={p.status}
                  notes={p.notes}
                  strike={p.status === "cancelled"}
                />
              ))
            )}
          </section>
        )}

        {!loading && children.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> My Children's Visas
            </h2>
            {children.map((c) => (
              <div key={c.student.id} className="space-y-2">
                <div className="text-sm font-medium text-foreground">{c.student.full_name ?? "Student"}</div>
                {c.periods.length === 0 ? (
                  c.record ? (
                    <PeriodCard
                      pathway={pathwayLabel((c.record as StudentVisaRecord).current_pathway)}
                      passNumber={c.record.pass_number}
                      issueDate={c.record.issue_date}
                      expiryDate={c.record.expiry_date}
                      status={c.record.status}
                      notes={c.record.notes}
                      bond={c.record.personal_bond_amount}
                      insuranceProvider={c.record.insurance_provider}
                      insurancePolicyNo={c.record.insurance_policy_no}
                      insuranceExpiry={c.record.insurance_expiry}
                      strike={c.record.status === "cancelled"}
                    />
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        No issued periods on record yet.
                      </CardContent>
                    </Card>
                  )
                ) : (
                  c.periods.map((p: StudentVisaPeriod) => (
                    <PeriodCard
                      key={p.id}
                      pathway={pathwayLabel(p.pathway)}
                      passNumber={p.pass_number}
                      issueDate={p.issue_date}
                      expiryDate={p.expiry_date}
                      status={p.status}
                      notes={p.notes}
                      bond={p.personal_bond_amount}
                      insuranceProvider={p.insurance_provider}
                      insurancePolicyNo={p.insurance_policy_no}
                      insuranceExpiry={p.insurance_expiry}
                      strike={p.status === "cancelled"}
                    />
                  ))
                )}
              </div>
            ))}
          </section>
        )}

        {!loading && parentRecords.length === 0 && children.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No visa records found.
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          To update visa details, please contact the school office.
        </p>
      </div>
    </AppLayout>
  );
}