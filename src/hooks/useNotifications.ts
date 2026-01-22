import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link_to: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Format time ago from date
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  // Computed values
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Format notifications for display
  const formattedNotifications = notifications.map(n => ({
    ...n,
    time: formatTimeAgo(n.created_at),
  }));

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      if (error) throw error;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (old) => old?.map(n => ({ ...n, is_read: true })) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (old) => old?.filter(n => n.id !== notificationId) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Seed initial notifications for testing (runs once if empty)
  // Seeds role-appropriate notifications based on user profile
  const seedNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      // Check if user already has notifications
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (count && count > 0) return; // Already has notifications
      
      // Get user's role to seed appropriate notifications
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const userRole = profile?.role || "parent";
      const now = new Date();
      
      // Common notifications for everyone
      const commonNotifications = [
        {
          user_id: user.id,
          title: "School Holiday Notice",
          message: "School will be closed on 29th January for Chinese New Year.",
          type: "announcement",
          link_to: userRole === "teacher" ? "/teacher" : "/parent",
          is_read: true,
          target_audience: "all",
          created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      // Teacher-specific notifications
      const teacherNotifications = userRole === "teacher" ? [
        {
          user_id: user.id,
          title: "Attendance Reminder",
          message: "Please submit attendance for Class 5A before 9:00 AM.",
          type: "attendance",
          link_to: "/teacher/attendance",
          is_read: false,
          target_audience: "teacher",
          created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: "Grade Submission Due",
          message: "Mid-Year exam grades for Class 5A are due by January 15th.",
          type: "grade",
          link_to: "/teacher/academic",
          is_read: false,
          target_audience: "teacher",
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: "Staff Meeting",
          message: "Weekly staff meeting scheduled for Friday at 3:00 PM in the conference room.",
          type: "event",
          link_to: "/teacher/calendar",
          is_read: false,
          target_audience: "teacher",
          created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        },
      ] : [];
      
      // Parent-specific notifications
      const parentNotifications = userRole === "parent" ? [
        {
          user_id: user.id,
          title: "Report Card Available",
          message: "Mid-Year 2025 report card is now available for viewing.",
          type: "report_card",
          link_to: "/parent/academic",
          is_read: false,
          target_audience: "parent",
          created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: "Parent-Teacher Meeting",
          message: "PTM scheduled for 20th January. Please book your slot.",
          type: "ptm",
          link_to: "/parent/calendar",
          is_read: false,
          target_audience: "parent",
          created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: "Fee Payment Reminder",
          message: "Term 2 school fees are due by 31st January.",
          type: "payment",
          link_to: "/parent",
          is_read: true,
          target_audience: "parent",
          created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ] : [];
      
      const seedData = [...commonNotifications, ...teacherNotifications, ...parentNotifications];
      
      const { error } = await supabase
        .from("notifications")
        .insert(seedData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
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
