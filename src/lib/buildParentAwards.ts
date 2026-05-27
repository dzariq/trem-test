import { supabase } from "@/lib/supabase";

export interface ParentAwardsAggregate {
  sports_house_org: string | null;
  sports_house_role: string | null;
  club_org: string | null;
  club_role: string | null;
  events_org: string | null;
  events_role: string | null;
  outdoor_org: string | null;
  outdoor_role: string | null;
  achievements_event: string | null;
  achievements_award: string | null;
  additional_award: string | null;
  additional_level: string | null;
  additional_remarks: string | null;
  clubs: { name: string; role: string }[];
  events: { name: string; role: string }[];
  outdoor: { name: string; role: string }[];
  awards: { event: string; award: string; type?: string | null }[];
  additional: { award_title: string; award_level: string; remarks: string | null }[];
}

const joinPair = (
  items: { name: string; role: string }[],
): { org: string | null; role: string | null } => {
  if (!items.length) return { org: null, role: null };
  return {
    org: items.map((i) => i.name).filter(Boolean).join(", ") || null,
    role: items.map((i) => i.role).filter(Boolean).join(", ") || null,
  };
};

/**
 * Parent-app counterpart of the school admin's `buildAutoCocurricular`.
 * Aggregates the student's awards/cocurricular signals on demand from
 * source tables — the flat `student_cocurricular_activities` table is
 * not used in this Supabase instance.
 */
export const buildParentAwards = async (
  studentId: string,
  academicPeriodId: string,
): Promise<ParentAwardsAggregate> => {
  const [
    { data: houseRoleRows },
    { data: sportHouseRows },
    { data: clubEnrollRows },
    { data: activityRoleRows },
    { data: awardRows },
    { data: additionalRows },
  ] = await Promise.all([
    supabase
      .from("sport_house_roles")
      .select("house_code, role, year_level")
      .eq("student_id", studentId),
    supabase
      .from("student_sport_houses")
      .select("sport_house")
      .eq("student_id", studentId),
    supabase
      .from("student_cca_enrollments")
      .select("cca_activity_id, status, cca_activities!inner(id, name, kind)")
      .eq("student_id", studentId)
      .eq("status", "active"),
    supabase
      .from("cca_activity_roles")
      .select("activity_id, role_label, cca_activities!inner(id, name, kind)")
      .eq("student_id", studentId)
      .or(`academic_period_id.is.null,academic_period_id.eq.${academicPeriodId}`),
    supabase
      .from("cca_event_awards")
      .select("activity_id, award_title, award_type, cca_activities!inner(id, name)")
      .eq("student_id", studentId)
      .or(`academic_period_id.is.null,academic_period_id.eq.${academicPeriodId}`),
    supabase
      .from("student_additional_achievements")
      .select("award_title, award_level, remarks, sort_order, created_at")
      .eq("student_id", studentId)
      .eq("academic_period_id", academicPeriodId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  // Sports house: prefer explicit role rows; fall back to membership-only.
  const shr = (houseRoleRows || []) as any[];
  let sports_house_org: string | null = null;
  let sports_house_role: string | null = null;
  if (shr.length) {
    sports_house_org = `${shr[0].house_code} House`;
    sports_house_role =
      shr
        .map((r) => (r.year_level ? `${r.role} (${r.year_level})` : r.role))
        .filter(Boolean)
        .join(", ") || null;
  } else {
    const ssh = (sportHouseRows || []) as any[];
    if (ssh.length && ssh[0].sport_house) {
      sports_house_org = `${ssh[0].sport_house} House`;
    }
  }

  // Per-activity role aggregation.
  const roleByActivity = new Map<string, string>();
  (activityRoleRows || []).forEach((r: any) => {
    const existing = roleByActivity.get(r.activity_id);
    roleByActivity.set(
      r.activity_id,
      existing ? `${existing}, ${r.role_label}` : r.role_label,
    );
  });

  const clubs: { name: string; role: string }[] = [];
  const outdoor: { name: string; role: string }[] = [];
  (clubEnrollRows || []).forEach((r: any) => {
    const act = r.cca_activities;
    if (!act) return;
    if (act.kind === "club") {
      clubs.push({ name: act.name, role: roleByActivity.get(act.id) || "" });
    } else if (act.kind === "outdoor") {
      outdoor.push({
        name: act.name,
        role: roleByActivity.get(act.id) || "Participant",
      });
    }
  });

  const events: { name: string; role: string }[] = [];
  const pushEvent = (actId: string, actName: string) => {
    if (events.some((e) => e.name === actName)) return;
    events.push({ name: actName, role: roleByActivity.get(actId) || "Participant" });
  };
  (clubEnrollRows || []).forEach((r: any) => {
    const act = r.cca_activities;
    if (!act || act.kind !== "event") return;
    pushEvent(act.id, act.name);
  });
  (activityRoleRows || []).forEach((r: any) => {
    const act = r.cca_activities;
    if (!act || act.kind !== "event") return;
    pushEvent(act.id, act.name);
  });

  const awards = (awardRows || []).map((r: any) => ({
    event: r.cca_activities?.name || "",
    award: r.award_title || "",
    type: r.award_type || null,
  }));

  const additional = ((additionalRows || []) as any[]).map((r) => ({
    award_title: r.award_title || "",
    award_level: r.award_level || "",
    remarks: r.remarks ?? null,
  }));

  const clubPair = joinPair(clubs);
  const eventPair = joinPair(events);
  const outdoorPair = joinPair(outdoor);

  const achievements_event =
    awards.map((a) => a.event).filter(Boolean).join(", ") || null;
  const achievements_award =
    awards.map((a) => a.award).filter(Boolean).join(", ") || null;

  const additional_award =
    additional.map((a) => a.award_title).filter(Boolean).join(", ") || null;
  const additional_level =
    additional.map((a) => a.award_level).filter(Boolean).join(", ") || null;
  const additional_remarks =
    additional.map((a) => a.remarks).filter(Boolean).join(", ") || null;

  return {
    sports_house_org,
    sports_house_role,
    club_org: clubPair.org,
    club_role: clubPair.role,
    events_org: eventPair.org,
    events_role: eventPair.role,
    outdoor_org: outdoorPair.org,
    outdoor_role: outdoorPair.role,
    achievements_event,
    achievements_award,
    additional_award,
    additional_level,
    additional_remarks,
    clubs,
    events,
    outdoor,
    awards,
    additional,
  };
};