import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the current authenticated user is listed as
 * `teacher_pic_main` or `teacher_pic_sub` on any bus belonging to the
 * given outdoor CCA activity. Used to grant bus-list visibility to
 * bus PICs who are not the activity PIC and have no year overlap.
 */
export function useIsBusPicForActivity(
  activityId: string | null | undefined,
  enabled: boolean = true
): boolean {
  const { user, profile } = useAuth();
  const [isBusPic, setIsBusPic] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsBusPic(false);
    const uid = user?.id ?? null;
    const role = profile?.role ?? "";
    if (!enabled || !activityId || !uid || role !== "teacher") return;
    (async () => {
      const { data, error } = await supabase
        .from("cca_outdoor_buses")
        .select("id")
        .eq("activity_id", activityId)
        .or(`teacher_pic_main.eq.${uid},teacher_pic_sub.eq.${uid}`)
        .limit(1);
      if (cancelled) return;
      if (error) {
        console.error("[useIsBusPicForActivity] failed:", error);
        return;
      }
      setIsBusPic((data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, enabled, user?.id, profile?.role]);

  return isBusPic;
}
