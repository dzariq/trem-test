import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the current teacher is listed as a Sport PIC on any
 * cca_session_sport_pics row whose parent session belongs to the given
 * outdoor CCA activity. Used to grant outdoor detail-page visibility
 * (incl. read-only bus list) to sport PICs who are not the activity PIC
 * and have no year overlap.
 */
export function useIsSportPicForActivity(
  activityId: string | null | undefined,
  enabled: boolean = true
): boolean {
  const { user, profile } = useAuth();
  const [isSportPic, setIsSportPic] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsSportPic(false);
    const uid = user?.id ?? null;
    const role = profile?.role ?? "";
    if (!enabled || !activityId || !uid || role !== "teacher") return;
    (async () => {
      const { data, error } = await supabase
        .from("cca_session_sport_pics")
        .select("session_id, cca_sessions!cca_session_sport_pics_session_id_fkey(activity_id)")
        .eq("teacher_user_id", uid);
      if (cancelled) return;
      if (error) {
        console.error("[useIsSportPicForActivity] failed:", error);
        return;
      }
      const hit = (data || []).some(
        (r: any) => r.cca_sessions?.activity_id === activityId
      );
      setIsSportPic(hit);
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, enabled, user?.id, profile?.role]);

  return isSportPic;
}
