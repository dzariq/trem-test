import { supabase } from "@/lib/supabase";

export type InvoiceStatus = "paid" | "pending_payment" | "draft" | "cancelled";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface ParentInvoice {
  id: string;
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

function normalize(row: any): ParentInvoice {
  const content = (row?.content ?? {}) as any;
  const amount = toNumber(content?.amount);
  const balance = toNumber(content?.balance);

  const outstandingFromCol = toNumber(row?.outstanding_amount);
  const paidFromCol = toNumber(row?.payment_amount);

  const outstandingAmount = outstandingFromCol > 0 ? outstandingFromCol : balance;
  const paidAmount = paidFromCol > 0 ? paidFromCol : Math.max(amount - balance, 0);

  const termItems: any[] = Array.isArray(content?.term_items) ? content.term_items : [];
  const dueDate = toDateString(termItems[0]?.date ?? row?.due_date);

  const formItems: any[] = Array.isArray(content?.form_items) ? content.form_items : [];
  const lineItems: InvoiceLineItem[] = formItems.map((it) => ({
    description: it?.description || it?.product_name || "Item",
    amount: toNumber(it?.amount ?? it?.net_amount),
  }));

  return {
    id: row.id,
    invoiceNumber: content?.number ?? null,
    periodKey: row.period_key ?? null,
    invoiceDate: toDateString(row.invoice_date),
    dueDate,
    status: normalizeStatus(row.status),
    rawStatus: row.status ?? "",
    type: row.type ?? null,
    amount,
    paidAmount,
    outstandingAmount,
    currency: content?.currency_code || "MYR",
    lineItems,
    bukkuUrl: row.url ?? null,
    isCreditNote: !!row.credit_note,
  };
}

/**
 * Fetch invoices for a single student.
 * Drafts and cancelled invoices are filtered out for parent view.
 */
export async function listInvoicesForStudent(studentId: string): Promise<ParentInvoice[]> {
  if (!studentId) return [];

  const { data: contacts, error: cErr } = await supabase
    .from("bukku_contacts")
    .select("bukku_contact_id")
    .eq("student_id", studentId);

  if (cErr) throw cErr;

  const contactIds = (contacts || [])
    .map((c: any) => c.bukku_contact_id)
    .filter(Boolean);

  if (contactIds.length === 0) return [];

  const { data, error } = await supabase
    .from("student_invoices")
    .select(
      "id, type, status, invoice_date, period_key, payment_amount, outstanding_amount, url, credit_note, content, bukku_contact_id"
    )
    .in("bukku_contact_id", contactIds.map((v: any) => Number(v)).filter((n) => Number.isFinite(n)))
    .order("invoice_date", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || [])
    .map(normalize)
    .filter((inv) => inv.status !== "draft" && inv.status !== "cancelled");
}