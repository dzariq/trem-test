import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { CcaActivity } from "@/hooks/useCcaActivities";

/**
 * Predicate filter for CCA activity list pages.
 *
 *  Principal (super_admin / admin / school_leader) -> show all.
 *  Teacher   -> show activities they are Main/Sub PIC of
 *               OR activities where they are a bus PIC (outdoor).
 *  Other     -> empty (parents use the eligibility hook).
 */
export function useCcaActivityFilter() {
  const { user, profile } = useAuth();

  const role = profile?.role ?? "";
  const isPrincipal =
    role === "super_admin" || role === "admin" || role === "school_leader";
  const isTeacher = role === "teacher";
  const uid = user?.id ?? null;

  const [busPicActivityIds, setBusPicActivityIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    let cancelled = false;
    if (!isTeacher || !uid) {
      setBusPicActivityIds(new Set());
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("cca_outdoor_buses")
        .select("activity_id")
        .or(`teacher_pic_main.eq.${uid},teacher_pic_sub.eq.${uid}`);
      if (cancelled) return;
      if (error) {
        console.error("[useCcaActivityFilter] bus PIC lookup failed:", error);
        setBusPicActivityIds(new Set());
        return;
      }
      setBusPicActivityIds(
        new Set((data || []).map((r: any) => r.activity_id).filter(Boolean))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [isTeacher, uid]);

  const canSee = useCallback(
    (activity: CcaActivity): boolean => {
      if (isPrincipal) return true;
      if (!isTeacher) return false;
      if (!uid) return false;

      if (
        (activity.picTeachers || []).some((t) => t.teacherUserId === uid)
      ) {
        return true;
      }
      if (busPicActivityIds.has(activity.id)) return true;
      return false;
    },
    [isPrincipal, isTeacher, uid, busPicActivityIds]
  );

  const apply = useCallback(
    (activities: CcaActivity[]): CcaActivity[] => activities.filter(canSee),
    [canSee]
  );

  return { canSee, apply, isPrincipal, isTeacher };
}
