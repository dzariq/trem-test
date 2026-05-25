import { supabase } from "@/integrations/supabase/client";

export type VisaStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "pending_renewal"
  | "cancelled"
  | "renewal_due"
  | "urgent"
  | "critical";

export type ParentVisaPathway = "MM2H" | "EP_I" | "EP_II" | "EP_III";
export type StudentVisaPathway = "PTS" | "STUDENT_PASS" | "DEPENDENT_PASS";

export type ParentVisaRecord = {
  id: string;
  parent_id: string;
  pass_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: VisaStatus;
  notes: string | null;
};

export type ParentVisaPeriod = {
  id: string;
  parent_id: string;
  period_no: number | null;
  pathway: ParentVisaPathway | null;
  pass_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  sent_for_renewal_date: string | null;
  status: VisaStatus;
  notes: string | null;
};

export type StudentVisaRecord = {
  id: string;
  student_id: string;
  current_pathway: StudentVisaPathway | null;
  status: VisaStatus;
  pass_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  parent_mm2h_holder_name: string | null;
  parent_mm2h_pass_number: string | null;
  parent_mm2h_expiry: string | null;
  moe_letter_ref: string | null;
  moe_letter_date: string | null;
  immigration_sticker_ref: string | null;
  personal_bond_amount: number | null;
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  insurance_expiry: string | null;
};

export type StudentVisaPeriod = {
  id: string;
  student_id: string;
  pathway: StudentVisaPathway | null;
  period_no: number | null;
  pass_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  sent_for_renewal_date: string | null;
  status: VisaStatus;
  parent_mm2h_holder_name: string | null;
  parent_mm2h_pass_number: string | null;
  parent_mm2h_expiry: string | null;
  personal_bond_amount: number | null;
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  insurance_expiry: string | null;
  notes: string | null;
};

export type ParentSelfInfo = {
  id: string;
  name: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_expiry_date: string | null;
};

export async function fetchMyParentVisa(): Promise<{
  self: ParentSelfInfo | null;
  records: ParentVisaRecord[];
  periods: ParentVisaPeriod[];
}> {
  const [recordsRes, periodsRes, selfRes] = await Promise.all([
    supabase.from("parent_visa_records").select("*"),
    supabase
      .from("parent_visa_periods")
      .select("*")
      .order("issue_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("parents")
      .select("id, name, nationality, passport_number, passport_expiry_date, is_primary_contact")
      .order("is_primary_contact", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (recordsRes.error) throw new Error(recordsRes.error.message);
  if (periodsRes.error) throw new Error(periodsRes.error.message);
  const selfRow = selfRes.data as any;
  const self: ParentSelfInfo | null = selfRow
    ? {
        id: String(selfRow.id),
        name: selfRow.name ?? null,
        nationality: selfRow.nationality ?? null,
        passport_number: selfRow.passport_number ?? null,
        passport_expiry_date: selfRow.passport_expiry_date ?? null,
      }
    : null;
  return {
    self,
    records: (recordsRes.data ?? []) as ParentVisaRecord[],
    periods: (periodsRes.data ?? []) as ParentVisaPeriod[],
  };
}

export type StudentVisaBundle = {
  student: {
    id: string;
    full_name: string | null;
    nationality: string | null;
    passport_number: string | null;
    passport_expiry_date: string | null;
  };
  record: StudentVisaRecord | null;
  periods: StudentVisaPeriod[];
};

export async function fetchMyChildrenVisa(): Promise<StudentVisaBundle[]> {
  // Use the parent's linked children (RLS-scoped) as source of truth so even
  // kids without visa records still show with their passport info.
  const studentsRes = await supabase
    .from("students")
    .select("id, name, nationality, passport_number, passport_expiry_date");
  if (studentsRes.error) throw new Error(studentsRes.error.message);
  const students = (studentsRes.data ?? []) as Array<{
    id: string;
    name: string | null;
    nationality: string | null;
    passport_number: string | null;
    passport_expiry_date: string | null;
  }>;
  if (!students.length) return [];

  const studentIds = students.map((s) => s.id);
  const [recordsRes, periodsRes] = await Promise.all([
    supabase.from("student_visa_records").select("*").in("student_id", studentIds),
    supabase
      .from("student_visa_periods")
      .select("*")
      .in("student_id", studentIds)
      .order("issue_date", { ascending: false, nullsFirst: false }),
  ]);
  if (recordsRes.error) throw new Error(recordsRes.error.message);
  if (periodsRes.error) throw new Error(periodsRes.error.message);
  const records = (recordsRes.data ?? []) as StudentVisaRecord[];
  const periods = (periodsRes.data ?? []) as StudentVisaPeriod[];

  return students.map((s) => ({
    student: {
      id: s.id,
      full_name: s.name,
      nationality: s.nationality,
      passport_number: s.passport_number,
      passport_expiry_date: s.passport_expiry_date,
    },
    record: records.find((r) => r.student_id === s.id) ?? null,
    periods: periods.filter((p) => p.student_id === s.id),
  }));
}

export function pathwayLabel(p: ParentVisaPathway | StudentVisaPathway | null): string {
  if (!p) return "—";
  switch (p) {
    case "EP_I": return "EP I";
    case "EP_II": return "EP II";
    case "EP_III": return "EP III";
    case "MM2H": return "MM2H";
    case "PTS": return "PTS";
    case "STUDENT_PASS": return "Student Pass";
    case "DEPENDENT_PASS": return "Dependent Pass";
    default: return String(p);
  }
}

/** Status chip metadata. */
export function statusMeta(status: VisaStatus): {
  label: string;
  className: string;
  strike?: boolean;
} {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "expiring_soon":
      return { label: "Expiring", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "renewal_due":
      return { label: "Renewal due", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "urgent":
      return { label: "Urgent", className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "critical":
      return { label: "Critical", className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "expired":
      return { label: "Expired", className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "pending_renewal":
      return { label: "Renewal in progress", className: "bg-sky-100 text-sky-700 border-sky-200" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-muted text-muted-foreground border-border", strike: true };
    default:
      return { label: String(status), className: "bg-muted text-muted-foreground border-border" };
  }
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}