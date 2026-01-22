import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CcaType {
  id: string;
  name: string;
  sortOrder: number;
}

/**
 * Fetches active CCA types from the backend.
 * Use this for dynamic tab generation instead of hardcoded categories.
 */
export function useCcaTypes() {
  const { data: types = [], isLoading, error, refetch } = useQuery({
    queryKey: ["cca-activity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cca_activity_types")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        sortOrder: t.sort_order ?? 0,
      })) as CcaType[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    types,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
