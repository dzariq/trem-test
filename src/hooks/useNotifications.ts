import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";

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
  const queryClient = useQueryClient();
  
  const userRole = profile?.role || "parent";
  const studentIds = linkedStudents?.map(s => s.id) || [];
  const queryKey = ["notifications", user?.id, userRole, studentIds.join(",")];

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const allNotifications: Notification[] = [];
      
      const allowedAudiences = userRole === "teacher" 
        ? ["teacher", "all"]
        : ["parent", "all"];
      
      const { data: dbNotifications } = await supabase
        .from("notifications")
        .select(`*, notification_reads!left(read_at), notification_dismissals!left(dismissed_at)`)
        .in("target_audience", allowedAudiences)
        .eq("notification_reads.user_id", user.id)
        .eq("notification_dismissals.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (dbNotifications) {
        for (const n of dbNotifications) {
          // Skip dismissed notifications
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
            if (session.session_date < today || session.session_date > in7Days) continue;
            if (seenSessions.has(session.id)) continue;
            seenSessions.add(session.id);
            
            const activityName = session.activity?.name || session.custom_title || "CCA Session";
            const startTime = session.start_time ? ` at ${session.start_time.slice(0, 5)}` : "";
            
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
              source_key: `cca-session:${session.id}`,
              is_read: false,
              event_date: session.session_date,
            });
          }
        }
      }
      
      const { data: calendarEvents } = await supabase
        .from("calendar_events")
        .select("id, title, start_date, event_category, description")
        .gte("start_date", today)
        .lte("start_date", in14Days)
        .in("visibility", ["public", "all"])
        .order("start_date", { ascending: true })
        .limit(15);
      
      if (calendarEvents) {
        const seenEvents = new Set<string>();
        for (const event of calendarEvents) {
          const eventKey = `${event.title}-${event.start_date.split("T")[0]}`;
          if (seenEvents.has(eventKey)) continue;
          seenEvents.add(eventKey);
          
          const category = (event.event_category || "").toLowerCase();
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
          }
          
          const eventDate = event.start_date.split("T")[0];
          
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
            source_key: `event:${event.id}`,
            is_read: false,
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
            if (session.session_date < today || session.session_date > in7Days) continue;
            
            const activityName = session.activity?.name || session.custom_title || "CCA Session";
            const startTime = session.start_time ? ` at ${session.start_time.slice(0, 5)}` : "";
            
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
              source_key: `teacher-cca:${session.id}`,
              is_read: false,
              event_date: session.session_date,
            });
          }
        }
      }
      
      allNotifications.sort((a, b) => {
        if (a.event_date && !b.event_date) return -1;
        if (!a.event_date && b.event_date) return 1;
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
      
      if (!notificationId.startsWith("cca-") && !notificationId.startsWith("event-") && !notificationId.startsWith("teacher-")) {
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
      }
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const dbNotifications = notifications.filter(n => 
        !n.is_read && 
        !n.id.startsWith("cca-") && 
        !n.id.startsWith("event-") && 
        !n.id.startsWith("teacher-")
      );
      
      if (dbNotifications.length === 0) return;
      
      const reads = dbNotifications.map(n => ({
        notification_id: n.id,
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
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);
      
      queryClient.setQueryData<Notification[]>(
        queryKey,
        (old) => old?.map(n => ({ ...n, is_read: true })) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      
      if (!notificationId.startsWith("cca-") && !notificationId.startsWith("event-") && !notificationId.startsWith("teacher-")) {
        const { error } = await supabase
          .from("notification_dismissals" as any)
          .upsert({
            notification_id: notificationId,
            user_id: user.id,
            dismissed_at: new Date().toISOString(),
          }, {
            onConflict: "notification_id,user_id",
          });
        
        if (error) throw error;
      }
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);
      
      queryClient.setQueryData<Notification[]>(
        queryKey,
        (old) => old?.filter(n => n.id !== notificationId) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
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
