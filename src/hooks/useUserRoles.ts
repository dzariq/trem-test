import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "parent" | "teacher" | "admin" | "super_admin" | "school_leader";

const TEACHER_SIDE: AppRole[] = ["teacher", "admin", "super_admin", "school_leader"];

export function useUserRoles() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    // AuthContext invalidates ["user-roles"] on SIGNED_IN/OUT/TOKEN_REFRESHED,
    // so we can safely cache for a few minutes instead of refetching on every
    // mount/focus (which was adding ~300-500ms to every navigation).
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    queryFn: async (): Promise<AppRole[]> => {
      let { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) {
        console.warn("[useUserRoles] first attempt error, retrying", error);
        await supabase.auth.getSession();
        const retry = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user!.id);
        if (retry.error) {
          console.error("[useUserRoles] fetch error", retry.error);
          throw retry.error;
        }
        data = retry.data;
      }
      const roles = (data ?? []).map((r: any) => r.role as AppRole);
      console.log("[useUserRoles] fetched", { userId: user!.id, roles });
      return roles;
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    hasParentRole: roles.includes("parent"),
    hasStudentRole: roles.includes("student" as AppRole),
    hasTeacherRole: roles.some((r) => TEACHER_SIDE.includes(r)),
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}
