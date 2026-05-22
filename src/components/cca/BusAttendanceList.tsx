import { useState } from "react";
import { ArrowLeft, ArrowRight, Bus, Check, Loader2, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatClassDisplay } from "@/lib/utils";
import {
  useCcaOutdoorBuses,
  type BusLeg,
  type CcaBusAssignment,
  type CcaOutdoorBus,
} from "@/hooks/useCcaOutdoorBuses";
import { useCcaBusPermissions } from "@/hooks/useCcaBusPermissions";
import type { CcaActivityPermissions } from "@/hooks/useCcaActivityPermissions";

interface BusAttendanceListProps {
  activityId: string;
  activityPerms: CcaActivityPermissions;
}

/**
 * Teacher-only bus list for outdoor CCA sessions. Each bus shows TWO
 * attendance sections (one per leg of the round trip):
 *   - Outbound: School → Venue   (writes `departed_school`)
 *   - Return:   Venue → School   (writes `departed_venue`)
 * Write access stays gated by RLS (principal, activity PIC, bus PIC main/sub).
 */
export function BusAttendanceList({ activityId, activityPerms }: BusAttendanceListProps) {
  const {
    buses,
    assignmentsByBus,
    picNames,
    loading,
    error,
    savingByAssignment,
    markLeg,
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
          {buses.map((bus, idx) => (
            <BusCard
              key={bus.id}
              bus={bus}
              busIndex={idx}
              assignments={assignmentsByBus[bus.id] || []}
              picNames={picNames}
              activityPerms={activityPerms}
              savingByAssignment={savingByAssignment}
              onMarkLeg={markLeg}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface BusCardProps {
  bus: CcaOutdoorBus;
  busIndex: number;
  assignments: CcaBusAssignment[];
  picNames: Record<string, string>;
  activityPerms: CcaActivityPermissions;
  savingByAssignment: Record<string, boolean>;
  onMarkLeg: (a: CcaBusAssignment, leg: BusLeg, value: boolean | null) => void;
}

function legValue(a: CcaBusAssignment, leg: BusLeg): boolean | null {
  return leg === "outbound" ? a.departed_school : a.departed_venue;
}

const BUS_THEMES = [
  { header: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60", icon: "text-sky-600 dark:text-sky-400" },
  { header: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/60", icon: "text-violet-600 dark:text-violet-400" },
  { header: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60", icon: "text-amber-600 dark:text-amber-400" },
  { header: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60", icon: "text-rose-600 dark:text-rose-400" },
  { header: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60", icon: "text-teal-600 dark:text-teal-400" },
  { header: "bg-fuchsia-50 dark:bg-fuchsia-950/30 border-fuchsia-200 dark:border-fuchsia-900/60", icon: "text-fuchsia-600 dark:text-fuchsia-400" },
];

const LEG_THEMES: Record<BusLeg, { active: string; strip: string }> = {
  outbound: {
    active: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800",
    strip: "bg-sky-50 dark:bg-sky-950/30 border-y border-sky-100 dark:border-sky-900/50",
  },
  return: {
    active: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800",
    strip: "bg-orange-50 dark:bg-orange-950/30 border-y border-orange-100 dark:border-orange-900/50",
  },
};

function BusCard({ bus, busIndex, assignments, picNames, activityPerms, savingByAssignment, onMarkLeg }: BusCardProps) {
  const perms = useCcaBusPermissions(bus, activityPerms);
  const mainName = bus.teacher_pic_main ? picNames[bus.teacher_pic_main] : null;
  const subName = bus.teacher_pic_sub ? picNames[bus.teacher_pic_sub] : null;
  const [activeLeg, setActiveLeg] = useState<BusLeg>("outbound");
  const theme = BUS_THEMES[busIndex % BUS_THEMES.length];

  return (
    <li className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Bus header */}
      <div className={cn("p-3 border-b", theme.header)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bus className={cn("h-4 w-4 shrink-0", theme.icon)} />
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
      </div>

      {assignments.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          No students assigned to this bus.
        </div>
      ) : (
        <>
          {/* Outbound / Return switcher */}
          <div className="px-3 pt-3 pb-2 flex gap-2">
            {([
              { id: "outbound" as BusLeg, label: "Outbound", icon: <ArrowRight className="h-3.5 w-3.5" /> },
              { id: "return" as BusLeg, label: "Return", icon: <ArrowLeft className="h-3.5 w-3.5" /> },
            ]).map((t) => {
              const active = activeLeg === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveLeg(t.id)}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    active
                      ? LEG_THEMES[t.id].active
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
          <LegSection
            leg={activeLeg}
            title={activeLeg === "outbound" ? "Outbound" : "Return"}
            subtitle={activeLeg === "outbound" ? "School → Venue" : "Venue → School"}
            icon={activeLeg === "outbound" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
            assignments={assignments}
            canManageBus={perms.canManageBus}
            savingByAssignment={savingByAssignment}
            onMarkLeg={onMarkLeg}
            stripClass={LEG_THEMES[activeLeg].strip}
          />
        </>
      )}
    </li>
  );
}

interface LegSectionProps {
  leg: BusLeg;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  assignments: CcaBusAssignment[];
  canManageBus: boolean;
  savingByAssignment: Record<string, boolean>;
  onMarkLeg: (a: CcaBusAssignment, leg: BusLeg, value: boolean | null) => void;
  divided?: boolean;
  stripClass?: string;
}

function LegSection({
  leg,
  title,
  subtitle,
  icon,
  assignments,
  canManageBus,
  savingByAssignment,
  onMarkLeg,
  divided,
  stripClass,
}: LegSectionProps) {
  const present = assignments.filter((a) => legValue(a, leg) === true).length;
  const absent = assignments.filter((a) => legValue(a, leg) === false).length;
  const marked = present + absent;

  return (
    <div className={cn(divided && "border-t border-border")}>
      <div className={cn(
        "px-3 py-2 flex items-center justify-between gap-2",
        stripClass || "bg-muted/40"
      )}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {icon}
          <span>{title}</span>
          <span className="text-[11px] font-normal text-muted-foreground">· {subtitle}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <Badge variant="outline" className="border bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300">
            P: {present}
          </Badge>
          <Badge variant="outline" className="border bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300">
            A: {absent}
          </Badge>
          <Badge variant="outline">— {assignments.length - marked}</Badge>
        </div>
      </div>
      <ul className="divide-y">
        {assignments.map((a) => {
          const value = legValue(a, leg);
          const present = value === true;
          const absent = value === false;
          const saving = !!savingByAssignment[`${a.id}:${leg}`];
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
              {canManageBus ? (
                <div className="flex gap-2 items-center">
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <button
                    type="button"
                    aria-label="Present"
                    disabled={saving}
                    onClick={() => onMarkLeg(a, leg, present ? null : true)}
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
                    onClick={() => onMarkLeg(a, leg, absent ? null : false)}
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
    </div>
  );
}
