import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { scheduleCcaReminders, type CcaReminderInput } from "@/lib/native/ccaLocalNotifications";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * On native platforms, schedule T-3 and T-0 local push reminders for the
 * user's upcoming CCA sessions (next 30 days). Re-runs on auth change, app
 * resume, and every 6 hours. No-op on web.
 */
export function useCcaPushReminders() {
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const { linkedStudents } = useStudentSelection();

  const userRole = profile?.role || "parent";
  const studentIds = (linkedStudents || []).map((s) => s.id);
  const studentIdsKey = studentIds.join(",");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user?.id) return;

    let cancelled = false;

    const run = async () => {
      try {
        const today = new Date();
        const todayIso = today.toISOString().slice(0, 10);
        const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const reminders: CcaReminderInput[] = [];

        if (userRole === "teacher") {
          const { data } = await supabase
            .from("cca_session_pics")
            .select(
              `session:cca_sessions(id, session_date, start_time, custom_title, activity:cca_activities(name))`,
            )
            .eq("teacher_user_id", user.id);
          for (const row of data || []) {
            const s = (row as any).session;
            if (!s?.session_date) continue;
            if (s.session_date < todayIso || s.session_date > in30) continue;
            reminders.push({
              role: "teacher",
              sessionId: s.id,
              activityName: s.activity?.name || s.custom_title || "CCA Session",
              sessionDate: s.session_date,
              startTime: s.start_time,
              link: "/teacher/calendar",
            });
          }
        } else if (studentIds.length > 0) {
          const { data } = await supabase
            .from("cca_session_enrollments")
            .select(
              `session:cca_sessions(id, session_date, start_time, custom_title, activity:cca_activities(name))`,
            )
            .in("student_id", studentIds)
            .eq("status", "enrolled");
          const seen = new Set<string>();
          for (const row of data || []) {
            const s = (row as any).session;
            if (!s?.session_date || seen.has(s.id)) continue;
            if (s.session_date < todayIso || s.session_date > in30) continue;
            seen.add(s.id);
            reminders.push({
              role: "parent",
              sessionId: s.id,
              activityName: s.activity?.name || s.custom_title || "CCA Session",
              sessionDate: s.session_date,
              startTime: s.start_time,
              link: "/parent/calendar",
            });
          }
        }

        if (cancelled) return;
        await scheduleCcaReminders(reminders);
      } catch (err) {
        console.warn("[useCcaPushReminders] failed", err);
      }
    };

    run();
    const interval = window.setInterval(run, REFRESH_INTERVAL_MS);

    let appListenerCleanup: (() => void) | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("resume", () => {
          run();
        });
        appListenerCleanup = () => handle.remove();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      appListenerCleanup?.();
    };
  }, [user?.id, userRole, studentIdsKey]);
}