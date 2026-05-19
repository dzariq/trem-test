import { Bus, Check, Loader2, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatClassDisplay } from "@/lib/utils";
import { useCcaOutdoorBuses } from "@/hooks/useCcaOutdoorBuses";
import { useCcaBusPermissions } from "@/hooks/useCcaBusPermissions";
import type { CcaActivityPermissions } from "@/hooks/useCcaActivityPermissions";

interface BusAttendanceListProps {
  activityId: string;
  activityPerms: CcaActivityPermissions;
}

/**
 * Teacher-only bus list for outdoor CCA sessions. Renders one card per bus
 * with its assigned students and a per-student present/absent toggle.
 * Toggle is disabled unless the current user is principal, activity PIC,
 * or the bus's own PIC main/sub.
 */
export function BusAttendanceList({ activityId, activityPerms }: BusAttendanceListProps) {
  const {
    buses,
    assignmentsByBus,
    picNames,
    loading,
    error,
    savingByAssignment,
    markAttendance,
  } = useCcaOutdoorBuses(activityId, activityPerms.canView);

  if (!activityPerms.canViewBuses) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bus className="h-5 w-5 text-primary" />
        <span className="font-medium">Bus list</span>
        <Badge variant="outline" className="text-[10px]">Teacher only</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading buses…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : buses.length === 0 ? (
        <div className="flex flex-col items-center text-center py-6 text-muted-foreground text-sm">
          <Bus className="h-5 w-5 mb-2" />
          No buses set up for this outdoor activity yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {buses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              assignments={assignmentsByBus[bus.id] || []}
              picNames={picNames}
              activityPerms={activityPerms}
              savingByAssignment={savingByAssignment}
              onMark={markAttendance}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface BusCardProps {
  bus: import("@/hooks/useCcaOutdoorBuses").CcaOutdoorBus;
  assignments: import("@/hooks/useCcaOutdoorBuses").CcaBusAssignment[];
  picNames: Record<string, string>;
  activityPerms: CcaActivityPermissions;
  savingByAssignment: Record<string, boolean>;
  onMark: (
    a: import("@/hooks/useCcaOutdoorBuses").CcaBusAssignment,
    attended: boolean | null
  ) => void;
}

function BusCard({ bus, assignments, picNames, activityPerms, savingByAssignment, onMark }: BusCardProps) {
  const perms = useCcaBusPermissions(bus, activityPerms);
  const marked = assignments.filter((a) => a.attended !== null).length;
  const present = assignments.filter((a) => a.attended === true).length;
  const absent = assignments.filter((a) => a.attended === false).length;
  const mainName = bus.teacher_pic_main ? picNames[bus.teacher_pic_main] : null;
  const subName = bus.teacher_pic_sub ? picNames[bus.teacher_pic_sub] : null;

  return (
    <li className="rounded-lg border border-border bg-card">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bus className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">{bus.name}</span>
            {!perms.canManageBus && (
              <Badge variant="secondary" className="text-[10px] shrink-0">View only</Badge>
            )}
            {perms.canManageBus && perms.isBusPic && !activityPerms.canEdit && (
              <Badge variant="default" className="text-[10px] shrink-0">Bus PIC</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Users className="h-3 w-3" />
            {assignments.length}
            {bus.capacity ? `/${bus.capacity}` : ""}
          </div>
        </div>
        {(mainName || subName) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {mainName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {mainName} <span className="opacity-60">(main)</span>
              </span>
            )}
            {subName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {subName} <span className="opacity-60">(sub)</span>
              </span>
            )}
          </div>
        )}
        {assignments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <Badge variant="outline" className="border bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300">
              Present: {present}
            </Badge>
            <Badge variant="outline" className="border bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300">
              Absent: {absent}
            </Badge>
            <Badge variant="outline">Unmarked: {assignments.length - marked}</Badge>
          </div>
        )}
      </div>
      {assignments.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          No students assigned to this bus.
        </div>
      ) : (
        <ul className="divide-y">
          {assignments.map((a) => {
            const saving = !!savingByAssignment[a.id];
            const present = a.attended === true;
            const absent = a.attended === false;
            return (
              <li key={a.id} className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.student_name}</p>
                  {a.student_class && (
                    <p className="text-[11px] text-muted-foreground">
                      {formatClassDisplay(a.student_class)}
                    </p>
                  )}
                </div>
                {perms.canManageBus ? (
                  <div className="flex gap-2 items-center">
                    {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <button
                      type="button"
                      aria-label="Present"
                      disabled={saving}
                      onClick={() => onMark(a, present ? null : true)}
                      className={cn(
                        "w-12 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                        present
                          ? "bg-green-500 text-white"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Absent"
                      disabled={saving}
                      onClick={() => onMark(a, absent ? null : false)}
                      className={cn(
                        "w-12 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                        absent
                          ? "bg-red-500 text-white"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      present && "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
                      absent && "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300"
                    )}
                  >
                    {present ? "Present" : absent ? "Absent" : "Unmarked"}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
