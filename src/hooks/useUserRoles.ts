import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "parent" | "teacher" | "admin" | "super_admin";

const TEACHER_SIDE: AppRole[] = ["teacher", "admin", "super_admin"];

export function useUserRoles() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.role as AppRole);
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    hasParentRole: roles.includes("parent"),
    hasStudentRole: roles.includes("student" as AppRole),
    hasTeacherRole: roles.some((r) => TEACHER_SIDE.includes(r)),
    isLoading: query.isLoading,
  };
}
