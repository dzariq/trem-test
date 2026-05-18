import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import type { CcaActivity } from "@/hooks/useCcaActivities";

/**
 * Returns a predicate filter for CCA activity list pages, matching the
 * unified permission model.
 *
 *  Principal -> show all.
 *  Teacher   -> show activities they PIC OR year-overlap.
 *  Other     -> empty (parents use the eligibility hook).
 */
export function useCcaActivityFilter() {
  const { user, profile } = useAuth();
  const scope = useTeacherScope();

  const role = profile?.role ?? "";
  const isPrincipal =
    role === "super_admin" || role === "admin" || role === "principal";
  const isTeacher = role === "teacher";
  const uid = user?.id ?? null;

  const teacherYearLevels = useMemo(
    () =>
      new Set(
        (scope.allowedClassYears || [])
          .map((c) => c.year_level)
          .filter(Boolean) as string[]
      ),
    [scope.allowedClassYears]
  );
  const teacherClassNames = useMemo(
    () =>
      new Set(
        (scope.allowedClassYears || [])
          .map((c) => c.class_name)
          .filter(Boolean) as string[]
      ),
    [scope.allowedClassYears]
  );

  const canSee = useCallback(
    (activity: CcaActivity): boolean => {
      if (isPrincipal) return true;
      if (!isTeacher) return false;

      // PIC always visible
      if (uid && (activity.picTeachers || []).some((t) => t.teacherUserId === uid)) {
        return true;
      }

      // Year-overlap fallback
      const kind = (activity.kind || "").toLowerCase();
      if (kind === "event") {
        const involved = activity.classesInvolved || [];
        return involved.some((c) => teacherClassNames.has(c));
      }
      const yls = activity.yearLevels || [];
      return yls.some((y) => teacherYearLevels.has(y));
    },
    [isPrincipal, isTeacher, uid, teacherYearLevels, teacherClassNames]
  );

  const apply = useCallback(
    (activities: CcaActivity[]): CcaActivity[] => activities.filter(canSee),
    [canSee]
  );

  return { canSee, apply, isPrincipal, isTeacher };
}
