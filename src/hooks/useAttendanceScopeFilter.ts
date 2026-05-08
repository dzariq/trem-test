import { useState, useMemo, useCallback } from "react";
import { stripCampusPrefix } from "@/lib/utils";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { useAuth } from "@/contexts/AuthContext";

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
  const isTeacher = teacherScope.isTeacher;

  const [scope, setScope] = useState<AttendanceScope>("school");
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([]);

  const availableClasses = teacherScope.allowedClassYears;

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
    loading: teacherScope.loading,
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
