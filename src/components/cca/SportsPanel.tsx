import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, MapPin, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Props {
  activityId: string;
}

interface SportRow {
  activityId: string;
  name: string;
  location: string | null;
  maxParticipants: number | null;
  sessionDates: string[];
  leads: { userId: string; name: string; role: string }[];
}

export function SportsPanel({ activityId }: Props) {
  const [rows, setRows] = useState<SportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: sessions, error: sErr } = await supabase
          .from("cca_sessions")
          .select("id, session_date, sport_activity_ids")
          .eq("activity_id", activityId);
        if (sErr) throw sErr;

        // sessionId -> date map; sportId -> sessionIds[]
        const dateBySession = new Map<string, string>();
        const sessionsBySport = new Map<string, Set<string>>();
        (sessions || []).forEach((s: any) => {
          dateBySession.set(s.id, s.session_date);
          (s.sport_activity_ids || []).forEach((sid: string) => {
            if (!sessionsBySport.has(sid)) sessionsBySport.set(sid, new Set());
            sessionsBySport.get(sid)!.add(s.id);
          });
        });
        const sportIds = Array.from(sessionsBySport.keys());

        if (sportIds.length === 0) {
          if (!cancelled) setRows([]);
          return;
        }

        const [actsRes, picsRes] = await Promise.all([
          supabase
            .from("cca_activities")
            .select("id, name, location, max_participants")
            .in("id", sportIds),
          supabase
            .from("cca_session_sport_pics")
            .select("activity_id, session_id, teacher_user_id, role")
            .in("activity_id", sportIds),
        ]);
        if (actsRes.error) throw actsRes.error;
        if (picsRes.error) throw picsRes.error;

        const teacherIds = Array.from(
          new Set((picsRes.data || []).map((p: any) => p.teacher_user_id))
        );
        const nameByUser = new Map<string, string>();
        if (teacherIds.length > 0) {
          const results = await Promise.all(
            teacherIds.map((uid) =>
              supabase.rpc("get_teacher_public_info", { p_teacher_user_id: uid })
            )
          );
          results.forEach((res) => {
            const row = res.data?.[0];
            if (row?.user_id) nameByUser.set(row.user_id, row.full_name || "Teacher");
          });
        }

        const picsBySport = new Map<string, SportRow["leads"]>();
        (picsRes.data || []).forEach((p: any) => {
          const arr = picsBySport.get(p.activity_id) || [];
          // de-dupe across sessions: keep unique by user+role
          if (!arr.some((x) => x.userId === p.teacher_user_id && x.role === p.role)) {
            arr.push({
              userId: p.teacher_user_id,
              name: nameByUser.get(p.teacher_user_id) || "Teacher",
              role: p.role,
            });
          }
          picsBySport.set(p.activity_id, arr);
        });

        const out: SportRow[] = (actsRes.data || []).map((a: any) => {
          const sessIds = Array.from(sessionsBySport.get(a.id) || []);
          const dates = sessIds
            .map((sid) => dateBySession.get(sid))
            .filter((d): d is string => !!d)
            .sort();
          return {
            activityId: a.id,
            name: a.name,
            location: a.location,
            maxParticipants: a.max_participants,
            sessionDates: dates,
            leads: (picsBySport.get(a.id) || []).sort((x, y) => {
              // main first
              const r = (s: string) => (s.toLowerCase().includes("main") ? 0 : 1);
              return r(x.role) - r(y.role) || x.name.localeCompare(y.name);
            }),
          };
        });
        out.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setRows(out);
      } catch (e: any) {
        console.error("[SportsPanel] load failed", e);
        if (!cancelled) setError(e?.message || "Failed to load sports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading sports…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No sports configured for this trip yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.activityId} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">{r.name}</h3>
              {r.maxParticipants != null && (
                <Badge variant="outline" className="text-xs gap-1 shrink-0">
                  <UsersIcon className="h-3 w-3" />
                  {r.maxParticipants}
                </Badge>
              )}
            </div>

            {r.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{r.location}</span>
              </div>
            )}

            {r.sessionDates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {r.sessionDates.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[11px] font-normal">
                    {format(parseISO(d), "EEE, d MMM")}
                  </Badge>
                ))}
              </div>
            )}

            <div className="pt-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Sport PIC
              </p>
              {r.leads.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No PIC assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {r.leads.map((l) => {
                    const isMain = l.role.toLowerCase().includes("main");
                    return (
                      <Badge
                        key={`${l.userId}-${l.role}`}
                        variant="outline"
                        className={cn(
                          "text-xs gap-1",
                          isMain
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <span>{l.name}</span>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wide",
                            isMain ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {isMain ? "Main" : "Sub"}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}