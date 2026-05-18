import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import type { CcaActivity } from "@/hooks/useCcaActivities";

/**
 * Unified CCA permission hook implementing the shared permission model.
 *
 *  Principal (super_admin / admin / principal)
 *    -> canView = true, canEdit = true, canEditBuses = true
 *
 *  Teacher who is in cca_activity_teachers (any role) for this activity
 *    -> isActivityPIC = true, canView = true, canEdit = true, canEditBuses = true
 *
 *  Teacher whose assigned class year-levels (clubs/outdoors) or class names (events)
 *  overlap the activity's scope
 *    -> hasYearOverlap = true, canView = true, canEdit = false
 *
 *  Anyone else -> all false. The detail sheet should refuse to render.
 *
 *  NOTE: For clubs, the canonical eligible year-set lives in
 *  cca_club_year_eligibility. This hook trusts `activity.yearLevels` (which the
 *  list hook already loads). DB RLS remains the source of truth.
 */
export interface CcaActivityPermissions {
  isPrincipal: boolean;
  isActivityPIC: boolean;
  hasYearOverlap: boolean;
  canView: boolean;
  canEdit: boolean;
  canEditBuses: boolean;
  /** Teacher-only bus list visibility: principal, activity PIC, or year overlap. Parents never see buses. */
  canViewBuses: boolean;
}

const NO_PERMS: CcaActivityPermissions = {
  isPrincipal: false,
  isActivityPIC: false,
  hasYearOverlap: false,
  canView: false,
  canEdit: false,
  canEditBuses: false,
  canViewBuses: false,
};

export function useCcaActivityPermissions(
  activity: CcaActivity | null | undefined
): CcaActivityPermissions {
  const { user, profile } = useAuth();
  const scope = useTeacherScope();

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

  return useMemo<CcaActivityPermissions>(() => {
    if (!activity || !profile) return NO_PERMS;

    const role = profile.role ?? "";
    const isPrincipal =
      role === "super_admin" || role === "admin" || role === "principal";
    const isParent = role === "parent";

    const uid = user?.id ?? null;
    const isActivityPIC =
      !!uid &&
      (activity.picTeachers || []).some((t) => t.teacherUserId === uid);

    const isTeacher = role === "teacher";
    let hasYearOverlap = false;
    if (isTeacher && !isPrincipal && !isActivityPIC) {
      const kind = (activity.kind || "").toLowerCase();
      if (kind === "event") {
        const involved = activity.classesInvolved || [];
        hasYearOverlap = involved.some((c) => teacherClassNames.has(c));
      } else {
        // club / outdoor / unknown -> match by year levels
        const yls = activity.yearLevels || [];
        hasYearOverlap = yls.some((y) => teacherYearLevels.has(y));
      }
    }

    // Parents always have read-only view because upstream eligibility hooks
    // already restrict which activities a parent can reach.
    const canView = isPrincipal || isActivityPIC || hasYearOverlap || isParent;
    const canEdit = isPrincipal || isActivityPIC;

    return {
      isPrincipal,
      isActivityPIC,
      hasYearOverlap,
      canView,
      canEdit,
      canEditBuses: canEdit,
      canViewBuses: isPrincipal || isActivityPIC || hasYearOverlap,
    };
  }, [activity, profile, user?.id, teacherYearLevels, teacherClassNames]);
}
