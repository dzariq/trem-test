import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusMeta, formatDate, type ParentVisaPeriod } from "@/data/visa";

export function StatusChip({ status }: { status: ParentVisaPeriod["status"] }) {
  const meta = statusMeta(status);
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", meta.className, meta.strike && "line-through")}>
      {meta.label}
    </Badge>
  );
}

export function ValidityLine({ issueDate, expiryDate, strike }: { issueDate: string | null; expiryDate: string | null; strike?: boolean }) {
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

const BACKFILL_PATTERNS = [
  /^backfilled from student record\.?$/i,
  /^backfilled from legacy record\b.*$/i,
];
export function cleanNotes(notes: string | null): string | null {
  if (!notes) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  if (BACKFILL_PATTERNS.some((re) => re.test(trimmed))) return null;
  return notes;
}

export function ExpiryProgress({
  issueDate,
  expiryDate,
  fallbackTotalDays = 365 * 10,
}: {
  issueDate?: string | null;
  expiryDate: string | null;
  fallbackTotalDays?: number;
}) {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const DAY = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((exp.getTime() - today.getTime()) / DAY);

  let totalDays: number;
  let elapsed: number;
  if (issueDate) {
    const iss = new Date(issueDate);
    if (!isNaN(iss.getTime())) {
      totalDays = Math.max(1, Math.round((exp.getTime() - iss.getTime()) / DAY));
      elapsed = Math.max(0, Math.round((today.getTime() - iss.getTime()) / DAY));
    } else {
      totalDays = fallbackTotalDays;
      elapsed = Math.max(0, totalDays - Math.max(0, daysLeft));
    }
  } else {
    totalDays = fallbackTotalDays;
    elapsed = Math.max(0, totalDays - Math.max(0, daysLeft));
  }

  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

  let barColor = "bg-emerald-400/70";
  if (daysLeft < 0) barColor = "bg-destructive/70";
  else if (daysLeft <= 90) barColor = "bg-amber-400/80";
  else if (daysLeft <= 180) barColor = "bg-sky-400/70";

  const remainingLabel =
    daysLeft < 0
      ? `Expired ${Math.abs(daysLeft)}d ago`
      : daysLeft === 0
        ? "Expires today"
        : daysLeft < 60
          ? `${daysLeft}d left`
          : daysLeft < 365
            ? `${Math.round(daysLeft / 30)}mo left`
            : `${Math.floor(daysLeft / 365)}y ${Math.round((daysLeft % 365) / 30)}mo left`;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground text-right">
        {remainingLabel}
      </div>
    </div>
  );
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

export function PassportSummary({
  nationality,
  passportNumber,
  passportExpiry,
}: {
  name?: string | null;
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
        {passportExpiry && <ExpiryProgress expiryDate={passportExpiry} fallbackTotalDays={365 * 10} />}
      </CardContent>
    </Card>
  );
}

export function BondInsuranceLine({
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

export function PeriodCard({
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
        {!strike && expiryDate && (
          <ExpiryProgress issueDate={issueDate} expiryDate={expiryDate} fallbackTotalDays={365 * 2} />
        )}
      </CardContent>
    </Card>
  );
}