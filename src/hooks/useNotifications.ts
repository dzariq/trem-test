import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  event_date?: string | null; // For sorting by upcoming date
}

// Format time relative to now or as upcoming date
function formatTimeDisplay(dateString: string, eventDate?: string | null): string {
  // If there's an event date in the future, show "in X days" or "Tomorrow"
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
  
  // Fallback to "time ago" for past items
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

// Format date for display
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

  // Fetch all notification sources in parallel
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id, userRole, studentIds.join(",")],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const allNotifications: Notification[] = [];
      
      // 1. Fetch stored notifications from DB (legacy/manual)
      const allowedAudiences = userRole === "teacher" 
        ? ["teacher", "all"]
        : ["parent", "all"];
      
      const { data: dbNotifications } = await supabase
        .from("notifications")
        .select(`*, notification_reads!left(read_at)`)
        .in("target_audience", allowedAudiences)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (dbNotifications) {
        for (const n of dbNotifications) {
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
      
      // 2. For PARENTS: Fetch upcoming CCA sessions for enrolled children
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
              is_read: false, // Dynamic items are always "unread" until dismissed
              event_date: session.session_date,
            });
          }
        }
      }
      
      // 3. Fetch upcoming calendar events (holidays, exams, school events)
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
          // Deduplicate by title + date (some events have duplicates)
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
      
      // 4. For TEACHERS: Add teacher-specific reminders
      if (userRole === "teacher") {
        // Fetch upcoming CCA sessions where teacher is PIC
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
      
      // Sort: upcoming events first (by event_date), then by created_at desc
      allNotifications.sort((a, b) => {
        // Prioritize items with event_date (upcoming)
        if (a.event_date && !b.event_date) return -1;
        if (!a.event_date && b.event_date) return 1;
        if (a.event_date && b.event_date) {
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        }
        // For items without event_date, sort by created_at desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Deduplicate by source_key
      const seen = new Set<string>();
      const deduped: Notification[] = [];
      for (const n of allNotifications) {
        const key = n.source_key || n.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(n);
        }
      }
      
      return deduped.slice(0, 30); // Limit total
    },
    enabled: !!user?.id && !!profile,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const formattedNotifications = notifications.map(n => ({
    ...n,
    time: formatTimeDisplay(n.created_at, n.event_date),
  }));

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      
      // Only persist to DB for actual DB notifications (not dynamic ones)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      // Only mark DB notifications as read
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
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id, userRole]);
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id, userRole, studentIds.join(",")],
        (old) => old?.map(n => ({ ...n, is_read: true })) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id, userRole, studentIds.join(",")], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      
      // For dynamic notifications, just mark locally
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
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id, userRole, studentIds.join(",")]);
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id, userRole, studentIds.join(",")],
        (old) => old?.filter(n => n.id !== notificationId) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id, userRole, studentIds.join(",")], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const seedNotificationsMutation = useMutation({
    mutationFn: async () => {
      // No-op - notifications are now generated dynamically
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
