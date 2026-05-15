import { useQuery } from "@tanstack/react-query";
import { listInvoicesForStudent, type ParentInvoice } from "@/data/invoices";

export function useStudentInvoices(studentId: string | null | undefined) {
  const query = useQuery({
    queryKey: ["studentInvoices", studentId],
    queryFn: () => listInvoicesForStudent(studentId as string),
    enabled: !!studentId,
    staleTime: 60_000,
  });

  return {
    invoices: (query.data ?? []) as ParentInvoice[],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}