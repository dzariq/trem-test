import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CcaActivityCard } from "@/components/cca/CcaActivityCard";
import { useCampus } from "@/contexts/CampusContext";
import {
  useTeacherInvolvedCcas,
  type MyCcaRole,
} from "@/hooks/useTeacherInvolvedCcas";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type KindFilter = "all" | "club" | "outdoor" | "event";

const TABS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "club", label: "Clubs" },
  { id: "outdoor", label: "Outdoor" },
  { id: "event", label: "Events" },
];

const ROLE_META: Record<MyCcaRole, { label: string; className: string }> = {
  pic: { label: "PIC", className: "bg-purple-100 text-purple-700 border-purple-200" },
  "co-pic": { label: "Co-PIC", className: "bg-sky-100 text-sky-700 border-sky-200" },
  "bus-pic": { label: "Bus PIC", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function TeacherCcaPage() {
  const { activeCampus } = useCampus();
  const navigate = useNavigate();
  const { activities, loading, counts, filterByKind } =
    useTeacherInvolvedCcas(activeCampus);

  const [tab, setTab] = useState<KindFilter>("all");

  const visible = useMemo(() => filterByKind(tab), [filterByKind, tab]);

  return (
    <TeacherAppLayout>
      <AppHeader title="My CCAs" showNotifications showProfile />

      {/* Sticky filter tabs */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+56px)] z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const count =
              t.id === "all" ? counts.all :
              t.id === "club" ? counts.club :
              t.id === "outdoor" ? counts.outdoor : counts.event;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {t.label}
                <span className={cn(
                  "ml-1.5 text-xs",
                  active ? "opacity-80" : "opacity-60"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No CCAs yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              You're not assigned to any {tab !== "all" ? tab : "CCA"} activities.
              Ask the CCA coordinator to add you as a PIC.
            </p>
          </div>
        )}

        {!loading &&
          visible.map((a) => {
            const meta = ROLE_META[a.myRole];
            return (
              <div key={a.id} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <Badge
                    variant="outline"
                    className={cn("border", meta.className)}
                  >
                    Your role · {meta.label}
                  </Badge>
                </div>
                <CcaActivityCard
                  activity={a as any}
                  variant="available"
                  onClick={() => navigate(`/teacher/cca/${a.id}`)}
                />
              </div>
            );
          })}
      </div>
    </TeacherAppLayout>
  );
}