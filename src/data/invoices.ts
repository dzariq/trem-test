import { supabase } from "@/lib/supabase";

export type InvoiceStatus = "paid" | "pending_payment" | "draft" | "cancelled";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface ParentInvoice {
  id: string;
  studentId: string;
  studentName: string | null;
  invoiceNumber: string | null;
  periodKey: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  status: InvoiceStatus;
  rawStatus: string;
  type: string | null;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  bukkuUrl: string | null;
  isCreditNote: boolean;
}

type JsonRecord = Record<string, unknown>;

type InvoiceRow = {
  id: string;
  type: string | null;
  status: string | null;
  invoice_date: string | null;
  due_date?: string | null;
  period_key: string | null;
  payment_amount: unknown;
  outstanding_amount: unknown;
  url: string | null;
  credit_note: boolean | null;
  content: JsonRecord | null;
  bukku_contact_id?: unknown;
};

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(s: string | null | undefined): InvoiceStatus {
  const v = (s || "").toLowerCase();
  if (v.startsWith("cancel")) return "cancelled";
  if (v === "paid") return "paid";
  if (v === "draft") return "draft";
  return "pending_payment";
}

function toDateString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed && !Number.isNaN(new Date(trimmed).getTime()) ? trimmed : null;
}

function normalize(
  row: InvoiceRow,
  studentId: string,
  studentName: string | null,
): ParentInvoice {
  const content = asRecord(row.content);
  const amount = toNumber(content.amount);
  const balance = toNumber(content.balance);

  const outstandingFromCol = toNumber(row.outstanding_amount);
  const paidFromCol = toNumber(row.payment_amount);

  const outstandingAmount = outstandingFromCol > 0 ? outstandingFromCol : balance;
  const paidAmount = paidFromCol > 0 ? paidFromCol : Math.max(amount - balance, 0);

  const termItems = Array.isArray(content.term_items) ? content.term_items.map(asRecord) : [];
  const dueDate = toDateString(termItems[0]?.date ?? row.due_date);

  const formItems = Array.isArray(content.form_items) ? content.form_items.map(asRecord) : [];
  const lineItems: InvoiceLineItem[] = formItems.map((it) => ({
    description: String(it.description || it.product_name || "Item"),
    amount: toNumber(it.amount ?? it.net_amount),
  }));

  return {
    id: row.id,
    studentId,
    studentName,
    invoiceNumber: typeof content.number === "string" ? content.number : null,
    periodKey: row.period_key ?? null,
    invoiceDate: toDateString(row.invoice_date),
    dueDate,
    status: normalizeStatus(row.status),
    rawStatus: row.status ?? "",
    type: row.type ?? null,
    amount,
    paidAmount,
    outstandingAmount,
    currency: typeof content.currency_code === "string" ? content.currency_code : "MYR",
    lineItems,
    bukkuUrl: row.url ?? null,
    isCreditNote: !!row.credit_note,
  };
}

/**
 * Fetch invoices for one or more students in a single batched query.
 * Each invoice carries the owning studentId/studentName so the UI can
 * display whose invoice it is when viewing "All Children".
 * Drafts and cancelled invoices are filtered out for parent view.
 */
export async function listInvoicesForStudents(
  students: { id: string; name: string | null }[],
): Promise<ParentInvoice[]> {
  const ids = students.map((s) => s.id).filter(Boolean);
  if (ids.length === 0) return [];

  const nameById = new Map(students.map((s) => [s.id, s.name ?? null]));

  const { data: contacts, error: cErr } = await supabase
    .from("bukku_contacts")
    .select("bukku_contact_id, student_id")
    .in("student_id", ids);

  if (cErr) throw cErr;

  // contactId (number) → studentId mapping
  const contactToStudent = new Map<number, string>();
  for (const row of (contacts || []) as { bukku_contact_id: unknown; student_id: string }[]) {
    const n = Number(row.bukku_contact_id);
    if (Number.isFinite(n) && row.student_id) contactToStudent.set(n, row.student_id);
  }

  if (contactToStudent.size === 0) return [];

  const { data, error } = await supabase
    .from("student_invoices")
    .select(
      "id, type, status, invoice_date, due_date, period_key, payment_amount, outstanding_amount, url, credit_note, content, bukku_contact_id",
    )
    .in("bukku_contact_id", Array.from(contactToStudent.keys()))
    .order("invoice_date", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || [])
    .map((row) => {
      const r = row as InvoiceRow;
      const sid = contactToStudent.get(Number(r.bukku_contact_id)) ?? "";
      return normalize(r, sid, nameById.get(sid) ?? null);
    })
    .filter((inv) => inv.studentId && inv.status !== "draft" && inv.status !== "cancelled");
}

/** Convenience wrapper for single-student callers. */
export async function listInvoicesForStudent(
  studentId: string,
  studentName?: string | null,
): Promise<ParentInvoice[]> {
  if (!studentId) return [];
  return listInvoicesForStudents([{ id: studentId, name: studentName ?? null }]);
}