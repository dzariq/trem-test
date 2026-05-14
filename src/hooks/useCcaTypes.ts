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
  return useCcaTypesByCampus(null);
}

export function useCcaTypesByCampus(campusCode: string | null | undefined) {
  const { data: types = [], isLoading, error, refetch } = useQuery({
    queryKey: ["cca-activity-types", campusCode ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("cca_activity_types")
        .select("id, name, sort_order, campus_code")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (campusCode) {
        query = query.or(`campus_code.eq.${campusCode},campus_code.is.null`);
      }
      const { data, error } = await query;

      if (error) throw error;

      // Deduplicate by name (campus-scoped variants share the same name)
      const seen = new Set<string>();
      const unique: CcaType[] = [];
      for (const t of data || []) {
        const key = (t.name || "").toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push({
          id: t.id,
          name: t.name,
          sortOrder: t.sort_order ?? 0,
        });
      }
      return unique;
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
