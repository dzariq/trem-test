import { useState, useMemo, useCallback, useEffect } from "react";
import { stripCampusPrefix } from "@/lib/utils";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { useAuth } from "@/contexts/AuthContext";
import { useCampus } from "@/contexts/CampusContext";
import { supabase } from "@/lib/supabase";

export type AttendanceScope = "school" | "cohort" | "class";

type ClassYear = {
  id: number;
  class_name: string;
  year_level: string;
  active: boolean;
};

export interface AttendanceScopeFilterState {
  /** Current active scope */
  scope: AttendanceScope;
  /** Selected cohort (year_level) when scope = cohort */
  selectedCohort: string | null;
  /** Selected class names when scope = class */
  selectedClassNames: string[];
  /** All class options available to this user */
  availableClasses: ClassYear[];
  /** Unique cohort (year_level) options available */
  availableCohorts: string[];
  /** Whether the user is a teacher (restricted view) */
  isTeacher: boolean;
  /** Loading state */
  loading: boolean;
  /** The resolved list of class names to query, based on current scope */
  resolvedClassNames: string[];
  /** Human-readable label for the active filter */
  filterLabel: string;
  /** Whether a non-default filter is active */
  isFiltered: boolean;

  // Actions
  setScope: (scope: AttendanceScope) => void;
  setSelectedCohort: (cohort: string | null) => void;
  setSelectedClassNames: (names: string[]) => void;
  toggleClassName: (name: string) => void;
  selectAllClasses: () => void;
  clearClassSelection: () => void;
  resetFilters: () => void;
}

export function useAttendanceScopeFilter(): AttendanceScopeFilterState {
  const { profile } = useAuth();
  const teacherScope = useTeacherScope();
  const { activeCampus } = useCampus();
  const isTeacher = teacherScope.isTeacher;

  const [scope, setScope] = useState<AttendanceScope>("school");
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([]);
  const [adminClassYears, setAdminClassYears] = useState<ClassYear[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // For non-teachers (admin / super_admin), the teacherScope hook returns an
  // empty allowedClassYears list (it only loads classes assigned to a teacher).
  // Fetch all active class_years directly so admins can filter by cohort/class.
  useEffect(() => {
    if (isTeacher) return;
    let mounted = true;
    setAdminLoading(true);
    (async () => {
      let q = supabase
        .from("class_years")
        .select("id, class_name, year_level, active")
        .eq("active", true)
        .order("year_level", { ascending: true })
        .order("class_name", { ascending: true });
      if (activeCampus) q = q.eq("campus_code", activeCampus);
      const { data, error } = await q;
      if (!mounted) return;
      if (error) {
        console.error("[useAttendanceScopeFilter] admin class_years fetch failed", error);
        setAdminClassYears([]);
      } else {
        setAdminClassYears((data ?? []) as ClassYear[]);
      }
      setAdminLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isTeacher, activeCampus]);

  const availableClasses = isTeacher ? teacherScope.allowedClassYears : adminClassYears;

  // When the active campus changes, drop any cohort/class selections that
  // belonged to the previous campus so stats reflect the new campus only.
  useEffect(() => {
    setSelectedCohort((prev) =>
      prev && availableClasses.some((c) => c.year_level === prev) ? prev : null
    );
    setSelectedClassNames((prev) => {
      const allowed = new Set(availableClasses.map((c) => c.class_name));
      const next = prev.filter((n) => allowed.has(n));
      return next.length === prev.length ? prev : next;
    });
  }, [activeCampus, availableClasses]);

  const availableCohorts = useMemo(() => {
    const cohorts = new Set(availableClasses.map((c) => c.year_level));
    return Array.from(cohorts).sort();
  }, [availableClasses]);

  // When scope is "school" for a teacher, use all their assigned classes.
  // For admin (non-teacher), "school" means no filter (empty array = all).
  const resolvedClassNames = useMemo(() => {
    if (scope === "school") {
      // Teacher: all assigned classes; Admin: empty = no filter
      return isTeacher
        ? availableClasses.map((c) => c.class_name)
        : [];
    }
    if (scope === "cohort" && selectedCohort) {
      return availableClasses
        .filter((c) => c.year_level === selectedCohort)
        .map((c) => c.class_name);
    }
    if (scope === "class" && selectedClassNames.length > 0) {
      return selectedClassNames;
    }
    // Fallback: teacher gets all assigned, admin gets all
    return isTeacher ? availableClasses.map((c) => c.class_name) : [];
  }, [scope, selectedCohort, selectedClassNames, availableClasses, isTeacher]);

  const filterLabel = useMemo(() => {
    if (scope === "school") return "Whole School";
    if (scope === "cohort" && selectedCohort) return `Cohort ${selectedCohort}`;
    if (scope === "class" && selectedClassNames.length > 0) {
      const unique = Array.from(new Set(selectedClassNames.map(stripCampusPrefix)));
      if (unique.length <= 2) return unique.join(", ");
      return `${unique.length} classes`;
    }
    return "Whole School";
  }, [scope, selectedCohort, selectedClassNames]);

  const isFiltered = scope !== "school";

  const toggleClassName = useCallback((name: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const selectAllClasses = useCallback(() => {
    setSelectedClassNames(availableClasses.map((c) => c.class_name));
  }, [availableClasses]);

  const clearClassSelection = useCallback(() => {
    setSelectedClassNames([]);
  }, []);

  const resetFilters = useCallback(() => {
    setScope("school");
    setSelectedCohort(null);
    setSelectedClassNames([]);
  }, []);

  return {
    scope,
    selectedCohort,
    selectedClassNames,
    availableClasses,
    availableCohorts,
    isTeacher,
    loading: isTeacher ? teacherScope.loading : adminLoading,
    resolvedClassNames,
    filterLabel,
    isFiltered,
    setScope,
    setSelectedCohort,
    setSelectedClassNames,
    toggleClassName,
    selectAllClasses,
    clearClassSelection,
    resetFilters,
  };
}
