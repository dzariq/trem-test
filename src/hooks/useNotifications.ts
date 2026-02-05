import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  link_to: string | null;
  is_read: boolean; // Computed from notification_reads join
  target_audience: string;
  created_at: string;
  updated_at: string;
  source_key: string | null;
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
  const { profile } = useMyProfile();
  const queryClient = useQueryClient();
  
  // Determine user role for filtering
  const userRole = profile?.role || "parent";

  // Fetch notifications with per-user read state via notification_reads
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Determine allowed target audiences based on role
      const allowedAudiences = userRole === "teacher" 
        ? ["teacher", "all"]
        : ["parent", "all"];
      
      // Fetch notifications with left join to notification_reads for current user
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          notification_reads!left(read_at)
        `)
        .in("target_audience", allowedAudiences)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map notifications with computed is_read based on notification_reads
      return (data || []).map((n: any) => ({
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
        // is_read is true if there's a notification_reads entry for this user
        is_read: Array.isArray(n.notification_reads) && n.notification_reads.length > 0,
      })) as Notification[];
    },
    enabled: !!user?.id && !!profile,
  });

  // Computed values
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Format notifications for display
  const formattedNotifications = notifications.map(n => ({
    ...n,
    time: formatTimeAgo(n.created_at),
  }));

  // Mark single notification as read (insert into notification_reads)
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read (insert into notification_reads for all unread)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;
      
      const reads = unreadNotifications.map(n => ({
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
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id, userRole]);
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id, userRole],
        (old) => old?.map(n => ({ ...n, is_read: true })) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id, userRole], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Dismiss notification (delete from notification_reads - effectively hide for user)
  // Note: We don't delete the notification itself, just mark as dismissed
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      
      // For now, dismissing is the same as marking as read
      // In the future, we could add a dismissed column to notification_reads
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
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications", user?.id, userRole]);
      
      // Optimistically mark as read (hide from unread)
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id, userRole],
        (old) => old?.map(n => n.id === notificationId ? { ...n, is_read: true } : n) || []
      );
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", user?.id, userRole], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Seed notifications is no longer needed since we generate from real data
  const seedNotificationsMutation = useMutation({
    mutationFn: async () => {
      // No-op - notifications are now generated from real data via triggers
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
