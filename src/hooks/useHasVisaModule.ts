import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the current user (parent) has any visa records
 * for themselves OR any of their linked students. RLS already scopes
 * the rows to the authenticated parent, so a simple count suffices.
 */
export function useHasVisaModule(): boolean {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["has-visa-module", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const [{ count: pCount }, { count: sCount }] = await Promise.all([
        supabase
          .from("parent_visa_records")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("student_visa_records")
          .select("id", { count: "exact", head: true }),
      ]);
      return (pCount ?? 0) + (sCount ?? 0) > 0;
    },
  });
  return data === true;
}