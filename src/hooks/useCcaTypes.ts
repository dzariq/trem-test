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

      // Deduplicate by name; prefer the entry matching the active campus
      const byName = new Map<string, any>();
      for (const t of data || []) {
        const key = (t.name || "").toLowerCase();
        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, t);
        } else if (campusCode && t.campus_code === campusCode && existing.campus_code !== campusCode) {
          byName.set(key, t);
        }
      }
      return Array.from(byName.values())
        .map((t) => ({ id: t.id, name: t.name, sortOrder: t.sort_order ?? 0 }))
        .sort((a, b) => a.sortOrder - b.sortOrder) as CcaType[];
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
