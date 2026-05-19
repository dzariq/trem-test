import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface CcaOutdoorBus {
  id: string;
  activity_id: string;
  name: string;
  teacher_pic_main: string | null;
  teacher_pic_sub: string | null;
  capacity: number | null;
  notes: string | null;
}

export type BusLeg = "outbound" | "return";

export interface CcaBusAssignment {
  id: string;
  bus_id: string;
  student_id: string;
  /** @deprecated legacy single flag; kept for back-compat. */
  attended: boolean | null;
  marked_at: string | null;
  marked_by: string | null;
  /** Outbound — school → venue. */
  departed_school: boolean | null;
  departed_school_at: string | null;
  departed_school_by: string | null;
  /** Return — venue → school. */
  departed_venue: boolean | null;
  departed_venue_at: string | null;
  departed_venue_by: string | null;
  student_name: string;
  student_class: string | null;
}

/**
 * Load all buses for an outdoor activity along with their student
 * assignments and current attendance flags. Exposes a `markAttendance`
 * mutation that respects the underlying RLS (principal, activity PIC, or
 * the bus PIC main/sub may write).
 */
export function useCcaOutdoorBuses(activityId: string | null | undefined, enabled: boolean = true) {
  const [buses, setBuses] = useState<CcaOutdoorBus[]>([]);
  const [assignmentsByBus, setAssignmentsByBus] = useState<Record<string, CcaBusAssignment[]>>({});
  const [picNames, setPicNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingByAssignment, setSavingByAssignment] = useState<Record<string, boolean>>({});

  const reload = useCallback(async () => {
    if (!enabled || !activityId) {
      setBuses([]);
      setAssignmentsByBus({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: busRows, error: busErr } = await supabase
        .from("cca_outdoor_buses")
        .select("id, activity_id, name, teacher_pic_main, teacher_pic_sub, capacity, notes")
        .eq("activity_id", activityId)
        .order("name", { ascending: true });
      if (busErr) throw busErr;
      const busList = (busRows || []) as CcaOutdoorBus[];
      setBuses(busList);

      if (busList.length === 0) {
        setAssignmentsByBus({});
        setPicNames({});
        return;
      }

      const busIds = busList.map((b) => b.id);
      const { data: rawAssignments, error: aErr } = await supabase
        .from("cca_bus_assignments")
        .select(
          "id, bus_id, student_id, attended, marked_at, marked_by, departed_school, departed_school_at, departed_school_by, departed_venue, departed_venue_at, departed_venue_by"
        )
        .in("bus_id", busIds);
      if (aErr) throw aErr;

      const studentIds = Array.from(
        new Set((rawAssignments || []).map((r: any) => r.student_id).filter(Boolean))
      );
      const studentMap = new Map<string, { name: string; class: string | null }>();
      if (studentIds.length > 0) {
        const { data: sRows, error: sErr } = await supabase
          .from("students")
          .select("id, name, class")
          .in("id", studentIds);
        if (sErr) throw sErr;
        (sRows || []).forEach((s: any) => {
          studentMap.set(s.id, { name: s.name, class: s.class ?? null });
        });
      }

      const grouped: Record<string, CcaBusAssignment[]> = {};
      busIds.forEach((id) => (grouped[id] = []));
      (rawAssignments || []).forEach((r: any) => {
        const info = studentMap.get(r.student_id);
        grouped[r.bus_id] = grouped[r.bus_id] || [];
        grouped[r.bus_id].push({
          id: r.id,
          bus_id: r.bus_id,
          student_id: r.student_id,
          attended: r.attended,
          marked_at: r.marked_at,
          marked_by: r.marked_by,
          departed_school: r.departed_school,
          departed_school_at: r.departed_school_at,
          departed_school_by: r.departed_school_by,
          departed_venue: r.departed_venue,
          departed_venue_at: r.departed_venue_at,
          departed_venue_by: r.departed_venue_by,
          student_name: info?.name || "Unknown student",
          student_class: info?.class ?? null,
        });
      });
      Object.keys(grouped).forEach((k) => {
        grouped[k].sort((a, b) => a.student_name.localeCompare(b.student_name));
      });
      setAssignmentsByBus(grouped);

      // PIC display names via security-definer RPC
      const teacherIds = Array.from(
        new Set(
          busList
            .flatMap((b) => [b.teacher_pic_main, b.teacher_pic_sub])
            .filter((v): v is string => !!v)
        )
      );
      if (teacherIds.length > 0) {
        const results = await Promise.all(
          teacherIds.map((uid) =>
            supabase.rpc("get_teacher_public_info", { p_teacher_user_id: uid })
          )
        );
        const names: Record<string, string> = {};
        results.forEach((res) => {
          const row = res.data?.[0];
          if (row?.user_id) names[row.user_id] = row.full_name || "Teacher";
        });
        setPicNames(names);
      } else {
        setPicNames({});
      }
    } catch (err: any) {
      console.error("[useCcaOutdoorBuses] load failed:", err);
      setError(err?.message || "Failed to load bus list");
    } finally {
      setLoading(false);
    }
  }, [enabled, activityId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const markLeg = useCallback(
    async (assignment: CcaBusAssignment, leg: BusLeg, value: boolean | null) => {
      const key = `${assignment.id}:${leg}`;
      setSavingByAssignment((prev) => ({ ...prev, [key]: true }));
      const previous =
        leg === "outbound" ? assignment.departed_school : assignment.departed_venue;

      // Optimistic update
      setAssignmentsByBus((prev) => {
        const list = prev[assignment.bus_id] || [];
        return {
          ...prev,
          [assignment.bus_id]: list.map((a) =>
            a.id === assignment.id
              ? leg === "outbound"
                ? { ...a, departed_school: value }
                : { ...a, departed_venue: value }
              : a
          ),
        };
      });

      try {
        const userRes = await supabase.auth.getUser();
        const uid = userRes.data.user?.id || null;
        const nowIso = new Date().toISOString();
        const patch =
          leg === "outbound"
            ? {
                departed_school: value,
                departed_school_at: value === null ? null : nowIso,
                departed_school_by: value === null ? null : uid,
              }
            : {
                departed_venue: value,
                departed_venue_at: value === null ? null : nowIso,
                departed_venue_by: value === null ? null : uid,
              };
        const { error: upErr } = await supabase
          .from("cca_bus_assignments")
          .update(patch)
          .eq("id", assignment.id);
        if (upErr) throw upErr;
      } catch (err: any) {
        console.error("[useCcaOutdoorBuses] markLeg failed:", err);
        toast({
          title: "Could not save",
          description: err?.message || "Failed to mark attendance",
          variant: "destructive",
        });
        // Revert
        setAssignmentsByBus((prev) => {
          const list = prev[assignment.bus_id] || [];
          return {
            ...prev,
            [assignment.bus_id]: list.map((a) =>
              a.id === assignment.id
                ? leg === "outbound"
                  ? { ...a, departed_school: previous }
                  : { ...a, departed_venue: previous }
                : a
            ),
          };
        });
      } finally {
        setSavingByAssignment((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    []
  );

  return {
    buses,
    assignmentsByBus,
    picNames,
    loading,
    error,
    savingByAssignment,
    markLeg,
    reload,
  };
}
