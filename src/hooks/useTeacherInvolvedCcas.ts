import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCampus } from "@/contexts/CampusContext";
import type { CcaActivity, CcaSession, CcaTeacher } from "@/hooks/useCcaActivities";

export type MyCcaRole = "pic" | "co-pic" | "bus-pic" | "sport-pic";

export interface OutdoorBusRole {
  busId: string;
  busName: string;
  slot: "main" | "sub";
}

export interface OutdoorSportRole {
  sportActivityId: string;
  sportName: string;
}

export interface InvolvedCcaActivity extends CcaActivity {
  myRole: MyCcaRole;
  /** Outdoor-only: buses this user is main/sub PIC of, for this trip. */
  outdoorBusRoles: OutdoorBusRole[];
  /** Outdoor-only: sports this user is lead PIC of, within this trip. */
  outdoorSportRoles: OutdoorSportRole[];
  /** Soonest upcoming session (YYYY-MM-DD) or null. */
  nextSessionDate: string | null;
}

function pickNextSessionDate(sessions: CcaSession[]): string | null {
  if (!sessions.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const future = sessions
    .filter((s) => !s.isCancelled && s.sessionDate && s.sessionDate >= today)
    .sort((a, b) => (a.sessionDate || "").localeCompare(b.sessionDate || ""));
  if (future.length > 0) return future[0].sessionDate;
  // Fall back to the most recent past session if no upcoming exists
  const past = sessions
    .filter((s) => s.sessionDate)
    .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""));
  return past[0]?.sessionDate ?? null;
}

/**
 * Fetch CCA activities where the logged-in teacher is INVOLVED:
 *   - PIC on cca_activity_teachers, OR
 *   - teacher_pic_main / teacher_pic_sub on cca_outdoor_buses, OR
 *   - sport lead on cca_session_sport_pics (parent trip resolved via the session)
 *
 * Scoped to the given campus (with NULL campus also included for global rows).
 */
export function useTeacherInvolvedCcas(campusCode: string | null) {
  const { user } = useAuth();
  const { loading: campusLoading } = useCampus();
  const uid = user?.id ?? null;

  const [activities, setActivities] = useState<InvolvedCcaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchAll = useCallback(async () => {
    if (!uid) {
      setActivities([]);
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // 1. Activity-teacher assignments
      const { data: picRows, error: picErr } = await supabase
        .from("cca_activity_teachers")
        .select("activity_id, role, is_primary")
        .eq("teacher_user_id", uid);
      if (picErr) throw picErr;

      // 2. Outdoor bus assignments (capture bus name + slot for the card chip)
      const { data: busRows, error: busErr } = await supabase
        .from("cca_outdoor_buses")
        .select("id, name, activity_id, teacher_pic_main, teacher_pic_sub")
        .or(`teacher_pic_main.eq.${uid},teacher_pic_sub.eq.${uid}`);
      if (busErr) throw busErr;

      // 3. Sport PIC assignments — resolve parent trip via session
      const { data: sportRows, error: sportErr } = await supabase
        .from("cca_session_sport_pics")
        .select(
          "session_id, activity_id, cca_sessions!cca_session_sport_pics_session_id_fkey(activity_id), cca_activities!cca_session_sport_pics_activity_id_fkey(name)"
        )
        .eq("teacher_user_id", uid);
      if (sportErr) throw sportErr;

      // Build per-trip aggregates
      const busesByActivity = new Map<string, OutdoorBusRole[]>();
      (busRows ?? []).forEach((r: any) => {
        const slot: "main" | "sub" =
          r.teacher_pic_main === uid ? "main" : "sub";
        const list = busesByActivity.get(r.activity_id) ?? [];
        list.push({ busId: r.id, busName: r.name || "Bus", slot });
        busesByActivity.set(r.activity_id, list);
      });

      const sportsByActivity = new Map<string, OutdoorSportRole[]>();
      (sportRows ?? []).forEach((r: any) => {
        const parentId = r.cca_sessions?.activity_id;
        const sportName = r.cca_activities?.name;
        if (!parentId || !sportName) return;
        const list = sportsByActivity.get(parentId) ?? [];
        // Dedup by sport activity id
        if (!list.some((s) => s.sportActivityId === r.activity_id)) {
          list.push({ sportActivityId: r.activity_id, sportName });
        }
        sportsByActivity.set(parentId, list);
      });

      // Build role map. Priority: activity PIC > bus PIC > sport PIC.
      // (Display chips can still show all involvements via outdoorBusRoles /
      // outdoorSportRoles regardless of which one "wins" the badge.)
      const roleMap = new Map<string, MyCcaRole>();
      (picRows ?? []).forEach((r: any) => {
        roleMap.set(r.activity_id, r.is_primary ? "pic" : "co-pic");
      });
      busesByActivity.forEach((_v, aid) => {
        if (!roleMap.has(aid)) roleMap.set(aid, "bus-pic");
      });
      sportsByActivity.forEach((_v, aid) => {
        if (!roleMap.has(aid)) roleMap.set(aid, "sport-pic");
      });

      const activityIds = Array.from(roleMap.keys());
      if (activityIds.length === 0) {
        if (requestId === requestIdRef.current) {
          setActivities([]);
          setLoading(false);
        }
        return;
      }

      // 3. Fetch full activity rows
      let q = supabase
        .from("cca_activities")
        .select(`
          id, name, public_description, category, type_id, kind,
          year_levels, classes_involved, meeting_day, meeting_time, location,
          is_active, max_participants, coordinator_name, coordinator_email,
          allow_free_text, image_url, campus_code,
          cca_activity_types(id, name),
          venue:venues!cca_activities_venue_id_fkey(id, name, image_url)
        `)
        .in("id", activityIds);
      if (campusCode) {
        q = q.or(`campus_code.eq.${campusCode},campus_code.is.null`);
      }
      const { data: raw, error: actErr } = await q;
      if (actErr) throw actErr;

      const rawActs = raw ?? [];
      const ids = rawActs.map((a: any) => a.id);

      // 4. PIC teachers (for display)
      const picTeachersMap = new Map<string, CcaTeacher[]>();
      if (ids.length > 0) {
        const { data: teacherRows } = await supabase
          .from("cca_activity_teachers")
          .select("id, activity_id, teacher_user_id, role, is_primary")
          .in("activity_id", ids);
        const userIds = [...new Set((teacherRows ?? []).map((t: any) => t.teacher_user_id).filter(Boolean))];
        const profiles: Record<string, { full_name: string; departments: string[] }> = {};
        if (userIds.length > 0) {
          const results = await Promise.all(
            userIds.map((id) => supabase.rpc("get_teacher_public_info", { p_teacher_user_id: id }))
          );
          results.forEach((r) => {
            if (r.data && r.data.length > 0) {
              const p = r.data[0];
              profiles[p.user_id] = {
                full_name: p.full_name || "Unknown Teacher",
                departments: Array.isArray(p.departments) ? p.departments : [],
              };
            }
          });
        }
        (teacherRows ?? []).forEach((t: any) => {
          const prof = profiles[t.teacher_user_id];
          const list = picTeachersMap.get(t.activity_id) ?? [];
          list.push({
            id: t.id,
            teacherUserId: t.teacher_user_id,
            role: t.role || "pic",
            isPrimary: !!t.is_primary,
            fullName: prof?.full_name || "Unknown Teacher",
            departments: prof?.departments || [],
          });
          picTeachersMap.set(t.activity_id, list);
        });
      }

      // 5. Upcoming sessions
      const sessionsMap = new Map<string, CcaSession[]>();
      if (ids.length > 0) {
        const { data: sessionRows } = await supabase
          .from("cca_sessions")
          .select("id, activity_id, session_date, start_time, end_time, location, is_cancelled, description, custom_title, requirements")
          .in("activity_id", ids)
          .eq("is_cancelled", false)
          .order("session_date", { ascending: true });
        (sessionRows ?? []).forEach((s: any) => {
          const list = sessionsMap.get(s.activity_id) ?? [];
          list.push({
            id: s.id,
            activityId: s.activity_id,
            sessionDate: s.session_date,
            startTime: s.start_time,
            endTime: s.end_time,
            location: s.location,
            isCancelled: !!s.is_cancelled,
            description: s.description,
            customTitle: s.custom_title,
            requirements: s.requirements,
          });
          sessionsMap.set(s.activity_id, list);
        });
      }

      const mapped: InvolvedCcaActivity[] = rawActs.map((a: any) => ({
        id: a.id,
        name: a.name,
        publicDescription: a.public_description,
        internalNotes: null,
        category: a.category || "Other",
        typeId: a.type_id || null,
        typeName: a.cca_activity_types?.name || null,
        kind: a.kind ?? null,
        yearLevels: Array.isArray(a.year_levels) ? a.year_levels.map(String) : [],
        classesInvolved: Array.isArray(a.classes_involved) ? a.classes_involved.filter(Boolean) : [],
        meetingDay: a.meeting_day,
        meetingTime: a.meeting_time,
        location: a.location,
        isActive: a.is_active,
        maxParticipants: a.max_participants,
        coordinatorName: a.coordinator_name,
        coordinatorEmail: a.coordinator_email,
        allowFreeText: a.allow_free_text ?? false,
        imageUrl: a.image_url || null,
        venue: a.venue
          ? { id: a.venue.id, name: a.venue.name, imageUrl: a.venue.image_url || null }
          : null,
        picTeachers: picTeachersMap.get(a.id) || [],
        sessions: sessionsMap.get(a.id) || [],
        myRole: roleMap.get(a.id) ?? "co-pic",
        outdoorBusRoles: busesByActivity.get(a.id) ?? [],
        outdoorSportRoles: sportsByActivity.get(a.id) ?? [],
        nextSessionDate: pickNextSessionDate(sessionsMap.get(a.id) ?? []),
      }));

      mapped.sort((a, b) => a.name.localeCompare(b.name));
      if (requestId === requestIdRef.current) {
        setActivities(mapped);
      }
    } catch (e: any) {
      console.error("[useTeacherInvolvedCcas] error:", e);
      if (requestId === requestIdRef.current) {
        setError(e?.message ?? "Failed to load CCAs");
        setActivities([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [uid, campusCode]);

  useEffect(() => {
    // Wait for campus context to finish loading so we don't fire an
    // unfiltered fetch that can race-overwrite the campus-filtered one.
    if (campusLoading) {
      setLoading(true);
      return;
    }
    fetchAll();
  }, [fetchAll, campusLoading]);

  const filterByKind = useCallback(
    (kind: "all" | "club" | "outdoor" | "event") => {
      if (kind === "all") return activities;
      return activities.filter((a) => {
        const k = (a.kind || "club").toLowerCase();
        return k === kind;
      });
    },
    [activities]
  );

  const counts = useMemo(() => {
    const c = { all: activities.length, club: 0, outdoor: 0, event: 0 };
    activities.forEach((a) => {
      const k = (a.kind || "club").toLowerCase();
      if (k === "club") c.club++;
      else if (k === "outdoor") c.outdoor++;
      else if (k === "event") c.event++;
    });
    return c;
  }, [activities]);

  return { activities, loading, error, refetch: fetchAll, filterByKind, counts };
}