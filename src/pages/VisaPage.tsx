import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Stamp, Plane, BookUser, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyFamilyParentsVisa,
  fetchMyChildrenVisa,
  pathwayLabel,
  statusMeta,
  formatDate,
  type ParentVisaPeriod,
  type StudentVisaPeriod,
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

function ValidityLine({ issueDate, expiryDate, strike }: { issueDate: string | null; expiryDate: string | null; strike?: boolean }) {
  if (!issueDate && !expiryDate) return null;
  let label = "";
  let value = "";
  if (issueDate && expiryDate) {
    label = "Validity:";
    value = `${formatDate(issueDate)} → ${formatDate(expiryDate)}`;
  } else if (expiryDate) {
    label = "Valid until:";
    value = formatDate(expiryDate);
  } else {
    label = "Issued:";
    value = formatDate(issueDate);
  }
  return (
    <div className={cn("text-sm text-foreground", strike && "line-through")}>
      <span className="text-muted-foreground">{label}</span> {value}
    </div>
  );
}

const BACKFILL_NOTE = "backfilled from student record";
function cleanNotes(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.trim().toLowerCase() === BACKFILL_NOTE) return null;
  return notes;
}

function passportExpiryMeta(dateStr: string | null) {
  if (!dateStr) return null;
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Expired", className: "bg-destructive/15 text-destructive border-destructive/30" };
  if (diff <= 90) return { label: "Expiring soon", className: "bg-amber-100 text-amber-700 border-amber-200" };
  return null;
}

function PassportSummary({
  name,
  nationality,
  passportNumber,
  passportExpiry,
}: {
  name: string | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
}) {
  const hasAny = nationality || passportNumber || passportExpiry;
  if (!hasAny) return null;
  const expMeta = passportExpiryMeta(passportExpiry);
  return (
    <Card className="border-sky-100 bg-sky-50/70 rounded-xl">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-sky-100 flex items-center justify-center">
            <BookUser className="h-3.5 w-3.5 text-sky-700" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Passport</span>
        </div>
        <div className="grid grid-cols-1 gap-y-1 text-sm">
          {nationality && (
            <div>
              <span className="text-muted-foreground">Nationality: </span>
              <span className="text-foreground">{nationality}</span>
            </div>
          )}
          {passportNumber && (
            <div>
              <span className="text-muted-foreground">Passport No: </span>
              <span className="font-mono text-foreground">{passportNumber}</span>
            </div>
          )}
          {passportExpiry && (
            <div className="flex items-center gap-2 flex-wrap">
              <div>
                <span className="text-muted-foreground">Expiry: </span>
                <span className="text-foreground">{formatDate(passportExpiry)}</span>
              </div>
              {expMeta && (
                <Badge variant="outline" className={cn("text-[10px] font-medium", expMeta.className)}>
                  {expMeta.label}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
  const cleanedNotes = cleanNotes(notes);
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
        <ValidityLine issueDate={issueDate} expiryDate={expiryDate} strike={strike} />
        <BondInsuranceLine
          bond={bond}
          provider={insuranceProvider}
          policyNo={insurancePolicyNo}
          insuranceExpiry={insuranceExpiry}
        />
        {cleanedNotes && <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{cleanedNotes}</div>}
      </CardContent>
    </Card>
  );
}

export default function VisaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const parentQuery = useQuery({
    queryKey: ["visa", "parent", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: fetchMyFamilyParentsVisa,
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

  const loading = parentQuery.isLoading || childrenQuery.isLoading;
  const parentsAll = parentQuery.data ?? [];
  const childrenAll = childrenQuery.data ?? [];

  // Only show entries that actually have visa info (records or periods).
  const parents = parentsAll
    .filter((b) => b.records.length > 0 || b.periods.length > 0)
    .sort((a, b) => {
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      const ap = a.parent.is_primary_contact ? 0 : 1;
      const bp = b.parent.is_primary_contact ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.parent.name ?? "").localeCompare(b.parent.name ?? "");
    });
  const children = childrenAll
    .filter((c) => !!c.record || c.periods.length > 0)
    .sort((a, b) => (a.student.full_name ?? "").localeCompare(b.student.full_name ?? ""));

  const showParentSection = parents.length > 0;
  const showChildrenSection = children.length > 0;
  const showEmptyState = !loading && !showParentSection && !showChildrenSection;

  const initialsOf = (name?: string | null) =>
    (name ?? "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

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

        {!loading && showParentSection && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              <span>Guardians</span>
              <span className="text-muted-foreground font-normal">· {parents.length}</span>
            </h2>
            <div className="space-y-4">
              {parents.map((b) => {
                const passCount = b.periods.length;
                return (
                  <div key={b.parent.id} className="rounded-2xl border border-border bg-card p-3 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                        {initialsOf(b.parent.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {b.parent.name ?? "Guardian"}
                          </span>
                          {b.isSelf && (
                            <Badge variant="outline" className="text-[10px] font-medium bg-sky-50 text-sky-700 border-sky-200">
                              You
                            </Badge>
                          )}
                          {b.parent.is_primary_contact && !b.isSelf && (
                            <Badge variant="outline" className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {passCount > 0 ? `${passCount} pass${passCount > 1 ? "es" : ""}` : "Passport only"}
                        </div>
                      </div>
                    </div>
                    <PassportSummary
                      name={b.parent.name}
                      nationality={b.parent.nationality}
                      passportNumber={b.parent.passport_number}
                      passportExpiry={b.parent.passport_expiry_date}
                    />
                    {b.periods.map((p: ParentVisaPeriod) => (
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
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading && showChildrenSection && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-sky-600" />
              <span>Students</span>
              <span className="text-muted-foreground font-normal">· {children.length}</span>
            </h2>
            <div className="space-y-4">
              {children.map((c) => {
                const passCount = c.periods.length;
                return (
                  <div key={c.student.id} className="rounded-2xl border border-border bg-card p-3 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                        {initialsOf(c.student.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {c.student.full_name ?? "Student"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {passCount > 0
                            ? `${passCount} pass${passCount > 1 ? "es" : ""}`
                            : c.record
                              ? "1 pass"
                              : "Passport only"}
                        </div>
                      </div>
                    </div>
                    <PassportSummary
                      name={c.student.full_name}
                      nationality={c.student.nationality}
                      passportNumber={c.student.passport_number}
                      passportExpiry={c.student.passport_expiry_date}
                    />
                    {c.periods.length === 0 && c.record ? (
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
                );
              })}
            </div>
          </section>
        )}

        {showEmptyState && (
          <Card className="border-dashed">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plane className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No visa records yet
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                Your family doesn't have any visa records on file. Once the school adds them, your passes and renewal status will appear here.
              </p>
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