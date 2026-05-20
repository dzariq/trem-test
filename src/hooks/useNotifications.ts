import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useCampus } from "@/contexts/CampusContext";
import { toast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  link_to: string | null;
  is_read: boolean;
  target_audience: string;
  created_at: string;
  updated_at: string;
  source_key: string | null;
  event_date?: string | null;
}

type SyntheticNotificationState = {
  read: string[];
  dismissed: string[];
};

const SYNTHETIC_NOTIFICATION_STORAGE_PREFIX = "synthetic-notification-state";

const emptySyntheticState = (): SyntheticNotificationState => ({
  read: [],
  dismissed: [],
});

const isSyntheticNotificationId = (notificationId: string) =>
  notificationId.startsWith("cca-") ||
  notificationId.startsWith("event-") ||
  notificationId.startsWith("teacher-") ||
  notificationId.startsWith("visa-");

const getNotificationTrackingKey = (notification: Pick<Notification, "id" | "source_key">) =>
  notification.source_key || notification.id;

const getSyntheticStateStorageKey = (userId: string) =>
  `${SYNTHETIC_NOTIFICATION_STORAGE_PREFIX}:${userId}`;

const getSyntheticNotificationState = (userId: string): SyntheticNotificationState => {
  if (typeof window === "undefined") return emptySyntheticState();

  try {
    const raw = window.localStorage.getItem(getSyntheticStateStorageKey(userId));
    if (!raw) return emptySyntheticState();

    const parsed = JSON.parse(raw) as Partial<SyntheticNotificationState>;
    return {
      read: Array.isArray(parsed.read) ? parsed.read : [],
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
    };
  } catch {
    return emptySyntheticState();
  }
};

const updateSyntheticNotificationState = (
  userId: string,
  updater: (state: SyntheticNotificationState) => SyntheticNotificationState,
) => {
  if (typeof window === "undefined") return;

  const next = updater(getSyntheticNotificationState(userId));
  window.localStorage.setItem(getSyntheticStateStorageKey(userId), JSON.stringify(next));
};

function formatTimeDisplay(dateString: string, eventDate?: string | null): string {
  if (eventDate) {
    const event = new Date(eventDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
    const diffDays = Math.floor((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays > 7 && diffDays <= 14) return `In ${Math.ceil(diffDays / 7)} week${diffDays > 7 ? 's' : ''}`;
  }
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function useNotifications() {
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const { linkedStudents } = useStudentSelection();
  const { activeCampus } = useCampus();
  const queryClient = useQueryClient();
  
  const userRole = profile?.role || "parent";
  const studentIds = linkedStudents?.map(s => s.id) || [];
  const scopedCampusCode =
    userRole === "teacher"
      ? activeCampus
      : (linkedStudents?.[0] as any)?.campus_code ?? null;
  const queryKey = ["notifications", user?.id, userRole, studentIds.join(","), scopedCampusCode];

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      // Backfill window: include this week's earlier days + next week so the
      // weekly/daily digests can render past + upcoming events.
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      const weekStartIso = weekStart.toISOString().split("T")[0];
      const syntheticState = getSyntheticNotificationState(user.id);
      const readSyntheticKeys = new Set(syntheticState.read);
      const dismissedSyntheticKeys = new Set(syntheticState.dismissed);
      
      const allNotifications: Notification[] = [];
      
      const allowedAudiences = userRole === "teacher" 
        ? ["teacher", "all"]
        : ["parent", "all"];
      
      const { data: dbNotifications } = await supabase
        .from("notifications")
        .select(`*, notification_reads!left(read_at), notification_dismissals!left(dismissed_at)`)
        .eq("user_id", user.id)
        .in("target_audience", allowedAudiences)
        .eq("notification_reads.user_id", user.id)
        .eq("notification_dismissals.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (dbNotifications) {
        for (const n of dbNotifications) {
          const isDismissed = Array.isArray((n as any).notification_dismissals) && (n as any).notification_dismissals.length > 0;
          if (isDismissed) continue;
          
          allNotifications.push({
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            link_to: n.link_to,
            target_audience: n.target_audience,
            created_at: n.created_at,
            updated_at: n.updated_at,
            source_key: n.source_key,
            is_read: Array.isArray(n.notification_reads) && n.notification_reads.length > 0,
            event_date: null,
          });
        }
      }
      
      if (userRole === "parent" && studentIds.length > 0) {
        const { data: ccaSessions } = await supabase
          .from("cca_session_enrollments")
          .select(`
            id,
            student_id,
            session:cca_sessions(
              id,
              session_date,
              start_time,
              custom_title,
              activity:cca_activities(name)
            )
          `)
          .in("student_id", studentIds)
          .eq("status", "enrolled");
        
        if (ccaSessions) {
          const seenSessions = new Set<string>();
          for (const enrollment of ccaSessions) {
            const session = enrollment.session as any;
            if (!session || !session.session_date) continue;
            if (session.session_date < weekStartIso || session.session_date > in14Days) continue;
            if (seenSessions.has(session.id)) continue;
            seenSessions.add(session.id);
            
            const activityName = session.activity?.name || session.custom_title || "CCA Session";
            const startTime = session.start_time ? ` at ${session.start_time.slice(0, 5)}` : "";
            const sourceKey = `cca-session:${session.id}`;
            if (dismissedSyntheticKeys.has(sourceKey)) continue;

            allNotifications.push({
              id: `cca-session-${session.id}`,
              user_id: null,
              title: `${activityName}`,
              message: `${formatEventDate(session.session_date)}${startTime}`,
              type: "cca",
              link_to: "/parent/calendar",
              target_audience: "parent",
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              source_key: sourceKey,
              is_read: readSyntheticKeys.has(sourceKey),
              event_date: session.session_date,
            });
          }
        }
      }
      
      let calendarEventsQuery = supabase
        .from("calendar_events")
        .select("id, title, start_date, event_category, description, event_categories:event_category(name)")
        .gte("start_date", weekStartIso)
        .lte("start_date", in14Days)
        .in("visibility", ["public", "all"])
        .order("start_date", { ascending: true })
        .limit(60);
      if (scopedCampusCode) {
        calendarEventsQuery = calendarEventsQuery.or(
          `campus_code.eq.${scopedCampusCode},campus_code.is.null`
        );
      }
      const { data: calendarEvents } = await calendarEventsQuery;
      
      if (calendarEvents) {
        const seenEvents = new Set<string>();
        for (const event of calendarEvents) {
          // Convert to LOCAL calendar date — events stored as 16:00 UTC
          // (= 00:00 SGT next day) would otherwise label one day early.
          const local = new Date(event.start_date);
          const eventDate = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
          const eventKey = `${event.title}-${eventDate}`;
          if (seenEvents.has(eventKey)) continue;
          seenEvents.add(eventKey);
          
          const categoryName =
            (event as any).event_categories?.name ?? "";
          const category = String(categoryName).toLowerCase();
          const titleLower = String(event.title || "").toLowerCase();
          let type = "event";
          let icon = "📅";
          
          if (category.includes("holiday")) {
            type = "holiday";
            icon = "🏖️";
          } else if (category.includes("exam")) {
            type = "exam";
            icon = "📝";
          } else if (category.includes("academic")) {
            type = "academic";
            icon = "📚";
          } else if (
            /\b(ph|public holiday|holiday|hari raya|cny|christmas|deepavali|break)\b/.test(titleLower)
          ) {
            type = "holiday";
            icon = "🏖️";
          } else if (
            /\b(mye|eoy|exam|test|tsm|dma|igcse|checkpoint|mfl|paper\s*\d)\b/.test(titleLower)
          ) {
            type = "exam";
            icon = "📝";
          } else if (
            /\b(cca|club|sport|practice|rehearsal)\b/.test(titleLower)
          ) {
            type = "cca";
            icon = "🎯";
          } else if (
            /\b(class|lesson|assembly|ptc|parent[- ]teacher|meeting|workshop|conference)\b/.test(titleLower)
          ) {
            type = "academic";
            icon = "📚";
          }
          
          const sourceKey = `event:${event.id}`;
          if (dismissedSyntheticKeys.has(sourceKey)) continue;

          allNotifications.push({
            id: `event-${event.id}`,
            user_id: null,
            title: `${icon} ${event.title}`,
            message: formatEventDate(eventDate),
            type,
            link_to: userRole === "teacher" ? "/teacher/calendar" : "/parent/calendar",
            target_audience: "all",
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            source_key: sourceKey,
            is_read: readSyntheticKeys.has(sourceKey),
            event_date: eventDate,
          });
        }
      }
      
      if (userRole === "teacher") {
        const { data: teacherSessions } = await supabase
          .from("cca_session_pics")
          .select(`
            session:cca_sessions(
              id,
              session_date,
              start_time,
              custom_title,
              activity:cca_activities(name)
            )
          `)
          .eq("teacher_user_id", user.id);
        
        if (teacherSessions) {
          for (const pic of teacherSessions) {
            const session = pic.session as any;
            if (!session || !session.session_date) continue;
            if (session.session_date < weekStartIso || session.session_date > in14Days) continue;
            
            const activityName = session.activity?.name || session.custom_title || "CCA Session";
            const startTime = session.start_time ? ` at ${session.start_time.slice(0, 5)}` : "";
            const sourceKey = `teacher-cca:${session.id}`;
            if (dismissedSyntheticKeys.has(sourceKey)) continue;

            allNotifications.push({
              id: `teacher-cca-${session.id}`,
              user_id: null,
              title: `📋 ${activityName} (PIC)`,
              message: `${formatEventDate(session.session_date)}${startTime}`,
              type: "cca",
              link_to: "/teacher/calendar",
              target_audience: "teacher",
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              source_key: sourceKey,
              is_read: readSyntheticKeys.has(sourceKey),
              event_date: session.session_date,
            });
          }
        }
      }

      // ── Visa deadline notifications (parent role) ──
      if (userRole === "parent") {
        const deadlineStatuses = [
          "expiring_soon",
          "renewal_due",
          "urgent",
          "critical",
          "expired",
          "pending_renewal",
        ];
        const statusLabel: Record<string, string> = {
          expiring_soon: "Expiring soon",
          renewal_due: "Renewal due",
          urgent: "Urgent",
          critical: "Critical",
          expired: "Expired",
          pending_renewal: "Renewal in progress",
        };
        const fmtDateShort = (d: string | null) => {
          if (!d) return "";
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d;
          return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        };

        // Parent's own visa periods (RLS already scopes to current parent)
        const { data: parentPeriods } = await supabase
          .from("parent_visa_periods")
          .select("id, pathway, pass_number, expiry_date, status")
          .in("status", deadlineStatuses);

        if (parentPeriods) {
          for (const p of parentPeriods as any[]) {
            const sourceKey = `visa-parent-period:${p.id}`;
            if (dismissedSyntheticKeys.has(sourceKey)) continue;
            const pathway = p.pathway ? String(p.pathway).replace(/_/g, " ") : "Visa";
            const exp = p.expiry_date ? ` — expires ${fmtDateShort(p.expiry_date)}` : "";
            allNotifications.push({
              id: `visa-parent-period-${p.id}`,
              user_id: null,
              title: `${pathway} — ${statusLabel[p.status] ?? p.status}`,
              message: `Your visa pass${p.pass_number ? ` (${p.pass_number})` : ""}${exp}`,
              type: "visa",
              link_to: "/parent/visa",
              target_audience: "parent",
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              source_key: sourceKey,
              is_read: readSyntheticKeys.has(sourceKey),
              event_date: p.expiry_date,
            });
          }
        }

        // Children's visa records (RLS scopes to parent's students)
        const { data: studentRecords } = await supabase
          .from("student_visa_records")
          .select("id, student_id, current_pathway, pass_number, expiry_date, status")
          .in("status", deadlineStatuses);

        if (studentRecords && studentRecords.length > 0) {
          const ids = Array.from(new Set((studentRecords as any[]).map((r) => r.student_id)));
          const { data: studentNames } = await supabase
            .from("students")
            .select("id, name")
            .in("id", ids);
          const nameById = new Map<string, string>(
            (studentNames ?? []).map((s: any) => [s.id, s.name ?? "Student"])
          );

          for (const r of studentRecords as any[]) {
            const sourceKey = `visa-student-record:${r.id}`;
            if (dismissedSyntheticKeys.has(sourceKey)) continue;
            const childName = nameById.get(r.student_id) ?? "Your child";
            const pathway = r.current_pathway ? String(r.current_pathway).replace(/_/g, " ") : "Visa";
            const exp = r.expiry_date ? ` — expires ${fmtDateShort(r.expiry_date)}` : "";
            allNotifications.push({
              id: `visa-student-record-${r.id}`,
              user_id: null,
              title: `${childName}: ${pathway} — ${statusLabel[r.status] ?? r.status}`,
              message: `Visa pass${r.pass_number ? ` (${r.pass_number})` : ""}${exp}`,
              type: "visa",
              link_to: "/parent/visa",
              target_audience: "parent",
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              source_key: sourceKey,
              is_read: readSyntheticKeys.has(sourceKey),
              event_date: r.expiry_date,
            });
          }
        }
      }
      
      allNotifications.sort((a, b) => {
        // Real DB notifications (no event_date) come first, newest first.
        // Calendar/CCA synthetic items (with event_date) follow, soonest first.
        if (!a.event_date && b.event_date) return -1;
        if (a.event_date && !b.event_date) return 1;
        if (a.event_date && b.event_date) {
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      const seen = new Set<string>();
      const deduped: Notification[] = [];
      for (const n of allNotifications) {
        const key = n.source_key || n.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(n);
        }
      }
      
      return deduped.slice(0, 30);
    },
    enabled: !!user?.id && !!profile,
    staleTime: 1000 * 60 * 2,
  });

  // ── Realtime subscription for notifications table ──
  useEffect(() => {
    if (!user?.id || !profile) return;

    const allowedAudiences = userRole === "teacher"
      ? ["teacher", "all"]
      : ["parent", "all"];

    const channel = supabase
      .channel(`notifications-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as any;
          // Only process if target_audience matches this user's role
          if (!allowedAudiences.includes(row.target_audience)) return;
          // Invalidate to refetch with full join (notification_reads etc.)
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as any;
          if (!allowedAudiences.includes(row.target_audience)) return;
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_reads",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_dismissals",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile, userRole, queryClient]);

  // ── Polling fallback: refetch every 60s ──
  useEffect(() => {
    if (!user?.id || !profile) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }, 60_000);

    return () => clearInterval(interval);
  }, [user?.id, profile, queryClient]);

  // ── App lifecycle: refetch on foreground resume ──
  useEffect(() => {
    if (!user?.id || !profile) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.id, profile, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const formattedNotifications = notifications.map(n => ({
    ...n,
    time: formatTimeDisplay(n.created_at, n.event_date),
  }));

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;

      const matchedNotification = notifications.find((item) => item.id === notificationId);
      const trackingKey = getNotificationTrackingKey(
        matchedNotification ?? { id: notificationId, source_key: null }
      );

      if (isSyntheticNotificationId(notificationId)) {
        updateSyntheticNotificationState(user.id, (state) => ({
          ...state,
          read: Array.from(new Set([...state.read, trackingKey])),
        }));
        return;
      }

      const { error } = await supabase
        .from("notification_reads")
        .upsert({
          notification_id: notificationId,
          user_id: user.id,
          read_at: new Date().toISOString(),
        }, {
          onConflict: "notification_id,user_id",
        });

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      queryClient.setQueryData<Notification[]>(
        queryKey,
        (old) => old?.map(n => n.id === notificationId ? { ...n, is_read: true } : n) || []
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Failed to update notification status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const unreadNotifications = notifications.filter((notification) => !notification.is_read);
      const syntheticTrackingKeys = unreadNotifications
        .filter((notification) => isSyntheticNotificationId(notification.id))
        .map((notification) => getNotificationTrackingKey(notification));

      if (syntheticTrackingKeys.length > 0) {
        updateSyntheticNotificationState(user.id, (state) => ({
          ...state,
          read: Array.from(new Set([...state.read, ...syntheticTrackingKeys])),
        }));
      }

      const dbNotifications = unreadNotifications.filter(
        (notification) => !isSyntheticNotificationId(notification.id)
      );

      if (dbNotifications.length === 0) return;

      const reads = dbNotifications.map((notification) => ({
        notification_id: notification.id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("notification_reads")
        .upsert(reads, {
          onConflict: "notification_id,user_id",
        });

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      queryClient.setQueryData<Notification[]>(
        queryKey,
        (old) => old?.map((notification) => ({ ...notification, is_read: true })) || []
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Failed to update notification status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;

      const matchedNotification = notifications.find((item) => item.id === notificationId);
      const trackingKey = getNotificationTrackingKey(
        matchedNotification ?? { id: notificationId, source_key: null }
      );

      if (isSyntheticNotificationId(notificationId)) {
        updateSyntheticNotificationState(user.id, (state) => ({
          ...state,
          dismissed: Array.from(new Set([...state.dismissed, trackingKey])),
        }));
        return;
      }

      const { error } = await supabase
        .from("notification_dismissals")
        .upsert({
          notification_id: notificationId,
          user_id: user.id,
          dismissed_at: new Date().toISOString(),
        }, {
          onConflict: "notification_id,user_id",
        });

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      queryClient.setQueryData<Notification[]>(
        queryKey,
        (old) => old?.filter((notification) => notification.id !== notificationId) || []
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Failed to update notification status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const seedNotificationsMutation = useMutation({
    mutationFn: async () => {
      // No-op
    },
  });

  return {
    notifications: formattedNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    seedNotifications: seedNotificationsMutation.mutate,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
