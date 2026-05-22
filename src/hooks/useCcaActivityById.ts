import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CcaSession,
  CcaTeacher,
} from "@/hooks/useCcaActivities";
import type {
  InvolvedCcaActivity,
  MyCcaRole,
} from "@/hooks/useTeacherInvolvedCcas";

export type CcaActivityFetchStatus =
  | "loading"
  | "ready"
  | "not_found"
  | "error";

interface UseCcaActivityByIdResult {
  activity: InvolvedCcaActivity | null;
  status: CcaActivityFetchStatus;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch a SINGLE CCA activity by id, independent of the list query.
 *
 * The teacher CCA detail page used to derive the visible activity by
 * calling `useTeacherInvolvedCcas(campus).activities.find(id)`. That coupled
 * the detail page to the full list (N+1 sub-queries + campus context) and
 * produced a transient "Not found" flash whenever the list hadn't settled
 * yet (auth still resolving, campus flipping, slow link, etc.).
 *
 * This hook talks to `cca_activities` for the one row, gates on auth being
 * ready, and only declares `not_found` once a real fetch with `user.id`
 * present has completed. Sub-fetches (teachers / sessions / buses) are
 * tolerant — they never demote a successful main fetch to "not found".
 */
export function useCcaActivityById(
  activityId: string | null | undefined
): UseCcaActivityByIdResult {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.id ?? null;

  const [activity, setActivity] = useState<InvolvedCcaActivity | null>(null);
  const [status, setStatus] = useState<CcaActivityFetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!activityId) {
      setActivity(null);
      setStatus("not_found");
      return;
    }
    // Wait for auth to settle. Without uid we can't compute myRole reliably
    // and RLS may hide the row — stay in "loading" instead of flashing
    // "Not found".
    if (authLoading || !uid) {
      setStatus("loading");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const { data: row, error: rowErr } = await supabase
        .from("cca_activities")
        .select(`
          id, name, public_description, category, type_id, kind,
          year_levels, classes_involved, meeting_day, meeting_time, location,
          is_active, max_participants, coordinator_name, coordinator_email,
          allow_free_text, image_url, campus_code,
          cca_activity_types(id, name),
          venue:venues!cca_activities_venue_id_fkey(id, name, image_url)
        `)
        .eq("id", activityId)
        .maybeSingle();

      if (rowErr) throw rowErr;
      if (!row) {
        setActivity(null);
        setStatus("not_found");
        return;
      }

      // Parallel sub-fetches. Failures here must NOT downgrade the result.
      const [teachersRes, busesRes, sessionsRes] = await Promise.allSettled([
        supabase
          .from("cca_activity_teachers")
          .select("id, activity_id, teacher_user_id, role, is_primary")
          .eq("activity_id", activityId),
        supabase
          .from("cca_outdoor_buses")
          .select("activity_id, teacher_pic_main, teacher_pic_sub")
          .eq("activity_id", activityId),
        supabase
          .from("cca_sessions")
          .select(
            "id, activity_id, session_date, start_time, end_time, location, is_cancelled, description, custom_title, requirements"
          )
          .eq("activity_id", activityId)
          .eq("is_cancelled", false)
          .order("session_date", { ascending: true }),
      ]);

      const teacherRows =
        teachersRes.status === "fulfilled" ? (teachersRes.value.data ?? []) : [];
      const busRows =
        busesRes.status === "fulfilled" ? (busesRes.value.data ?? []) : [];
      const sessionRows =
        sessionsRes.status === "fulfilled" ? (sessionsRes.value.data ?? []) : [];

      // Determine myRole: PIC > co-pic > bus-pic.
      let myRole: MyCcaRole = "co-pic";
      const myTeacherRow = teacherRows.find(
        (t: any) => t.teacher_user_id === uid
      );
      if (myTeacherRow) {
        myRole = myTeacherRow.is_primary ? "pic" : "co-pic";
      } else if (
        busRows.some(
          (b: any) =>
            b.teacher_pic_main === uid || b.teacher_pic_sub === uid
        )
      ) {
        myRole = "bus-pic";
      }

      // Resolve teacher names via the safe RPC (best-effort).
      const teacherUserIds = [
        ...new Set(
          teacherRows.map((t: any) => t.teacher_user_id).filter(Boolean)
        ),
      ];
      const profiles: Record<
        string,
        { full_name: string; departments: string[] }
      > = {};
      if (teacherUserIds.length > 0) {
        const results = await Promise.allSettled(
          teacherUserIds.map((id) =>
            supabase.rpc("get_teacher_public_info", {
              p_teacher_user_id: id,
            })
          )
        );
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value.data && r.value.data.length > 0) {
            const p = r.value.data[0];
            profiles[p.user_id] = {
              full_name: p.full_name || "Unknown Teacher",
              departments: Array.isArray(p.departments) ? p.departments : [],
            };
          }
        });
      }

      const picTeachers: CcaTeacher[] = teacherRows.map((t: any) => {
        const prof = profiles[t.teacher_user_id];
        return {
          id: t.id,
          teacherUserId: t.teacher_user_id,
          role: t.role || "pic",
          isPrimary: !!t.is_primary,
          fullName: prof?.full_name || "Unknown Teacher",
          departments: prof?.departments || [],
        };
      });

      const sessions: CcaSession[] = sessionRows.map((s: any) => ({
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
      }));

      const a: any = row;
      const mapped: InvolvedCcaActivity = {
        id: a.id,
        name: a.name,
        publicDescription: a.public_description,
        internalNotes: null,
        category: a.category || "Other",
        typeId: a.type_id || null,
        typeName: a.cca_activity_types?.name || null,
        kind: a.kind ?? null,
        yearLevels: Array.isArray(a.year_levels)
          ? a.year_levels.map(String)
          : [],
        classesInvolved: Array.isArray(a.classes_involved)
          ? a.classes_involved.filter(Boolean)
          : [],
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
          ? {
              id: a.venue.id,
              name: a.venue.name,
              imageUrl: a.venue.image_url || null,
            }
          : null,
        picTeachers,
        sessions,
        myRole,
        outdoorBusRoles: [],
        outdoorSportRoles: [],
        outdoorAllSports: [],
        nextSessionDate: null,
      };

      setActivity(mapped);
      setStatus("ready");
    } catch (e: any) {
      console.error("[useCcaActivityById] error:", e);
      setError(e?.message ?? "Failed to load CCA");
      setStatus("error");
    }
  }, [activityId, authLoading, uid]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  return { activity, status, error, refetch: fetchOne };
}
