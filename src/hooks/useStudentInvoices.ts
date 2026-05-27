import { useQuery } from "@tanstack/react-query";
import { listInvoicesForStudents, type ParentInvoice } from "@/data/invoices";

type StudentInput = { id: string; name: string | null }[] | null | undefined;

export function useStudentInvoices(students: StudentInput) {
  const list = students ?? [];
  const key = list.map((s) => s.id).sort().join(",");
  const query = useQuery({
    queryKey: ["studentInvoices", key],
    queryFn: () => listInvoicesForStudents(list),
    enabled: list.length > 0,
    staleTime: 60_000,
  });

  return {
    invoices: (query.data ?? []) as ParentInvoice[],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}