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

export type ParentInfo = {
  id: string;
  name: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_expiry_date: string | null;
  parent_user_id: string | null;
  family_id: string | null;
  is_primary_contact: boolean | null;
};

export type ParentVisaBundle = {
  parent: ParentInfo;
  isSelf: boolean;
  records: ParentVisaRecord[];
  periods: ParentVisaPeriod[];
};

export async function fetchMyFamilyParentsVisa(): Promise<ParentVisaBundle[]> {
  const { data: userData } = await supabase.auth.getUser();
  const myUid = userData.user?.id ?? null;

  const parentsRes = await supabase.rpc("get_my_family_parents");
  if (parentsRes.error) throw new Error(parentsRes.error.message);
  const parents = (parentsRes.data ?? []) as ParentInfo[];
  if (!parents.length) return [];

  const [recordsRes, periodsRes] = await Promise.all([
    supabase.rpc("get_my_family_parent_visa"),
    supabase.rpc("get_my_family_parent_visa_periods"),
  ]);
  if (recordsRes.error) throw new Error(recordsRes.error.message);
  if (periodsRes.error) throw new Error(periodsRes.error.message);
  const records = (recordsRes.data ?? []) as ParentVisaRecord[];
  const periods = (periodsRes.data ?? []) as ParentVisaPeriod[];

  return parents
    .map((p) => ({
      parent: p,
      isSelf: !!myUid && p.parent_user_id === myUid,
      records: records.filter((r) => r.parent_id === p.id),
      periods: periods.filter((pe) => pe.parent_id === p.id),
    }))
    .sort((a, b) => {
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      const ap = a.parent.is_primary_contact ? 0 : 1;
      const bp = b.parent.is_primary_contact ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.parent.name ?? "").localeCompare(b.parent.name ?? "");
    });
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
  // RPC returns kids across ALL families linked to the signed-in parent,
  // not only those backfilled into student_guardians.
  const studentsRes = await supabase.rpc("get_my_family_students");
  if (studentsRes.error) throw new Error(studentsRes.error.message);
  const students = (studentsRes.data ?? []) as Array<{
    id: string;
    name: string | null;
    nationality: string | null;
    passport_number: string | null;
    passport_expiry_date: string | null;
  }>;
  if (!students.length) return [];

  const [recordsRes, periodsRes] = await Promise.all([
    supabase.rpc("get_my_family_student_visa"),
    supabase.rpc("get_my_family_student_visa_periods"),
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