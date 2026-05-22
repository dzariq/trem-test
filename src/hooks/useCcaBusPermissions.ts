import { useAuth } from "@/contexts/AuthContext";
import type { CcaActivityPermissions } from "@/hooks/useCcaActivityPermissions";

export interface CcaBusLike {
  id: string;
  teacher_pic_main: string | null;
  teacher_pic_sub: string | null;
}

export interface CcaBusPermissions {
  canViewBus: boolean;
  canManageBus: boolean;
  isBusPic: boolean;
}

/**
 * Per-bus permissions for outdoor CCAs.
 *
 *  canViewBus   = activity.canView (teachers always allowed via SELECT RLS)
 *  canManageBus = principal/admin OR uid == bus.teacher_pic_main/sub
 *
 *  Note: a regular activity PIC who is NOT the bus's main/sub PIC is
 *  view-only. Only the bus's actual PICs (or system principals) can take
 *  outbound/return attendance. Sport PICs are always view-only.
 */
export function useCcaBusPermissions(
  bus: CcaBusLike | null | undefined,
  activityPerms: CcaActivityPermissions
): CcaBusPermissions {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  if (!bus) {
    return { canViewBus: activityPerms.canView, canManageBus: false, isBusPic: false };
  }

  const isBusPic =
    !!uid && (bus.teacher_pic_main === uid || bus.teacher_pic_sub === uid);

  return {
    canViewBus: activityPerms.canView,
    canManageBus: activityPerms.isPrincipal || isBusPic,
    isBusPic,
  };
}
