import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface CcaSessionFormData {
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  locationId: string | null;
  location: string | null;
  customTitle: string | null;
  description: string | null;
  requirements: string | null;
}

export interface CcaSession {
  id: string;
  activityId: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  locationId: string | null;
  location: string | null;
  locationName: string | null;
  isCancelled: boolean;
  description: string | null;
  customTitle: string | null;
  requirements: string | null;
}

interface UseCcaSessionsOptions {
  activityId: string;
}

export function useCcaSessions({ activityId }: UseCcaSessionsOptions) {
  const [sessions, setSessions] = useState<CcaSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!activityId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("cca_sessions")
        .select(`
          id,
          activity_id,
          session_date,
          start_time,
          end_time,
          location_id,
          location,
          is_cancelled,
          description,
          custom_title,
          requirements,
          school_locations(name)
        `)
        .eq("activity_id", activityId)
        .order("session_date", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: CcaSession[] = (data || []).map((s: any) => ({
        id: s.id,
        activityId: s.activity_id,
        sessionDate: s.session_date,
        startTime: s.start_time,
        endTime: s.end_time,
        locationId: s.location_id,
        location: s.location,
        locationName: s.school_locations?.name || s.location || null,
        isCancelled: s.is_cancelled,
        description: s.description,
        customTitle: s.custom_title,
        requirements: s.requirements,
      }));

      setSessions(mapped);
    } catch (err: any) {
      console.error("[useCcaSessions] fetchSessions error:", err);
      setError(err?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  const createSession = useCallback(
    async (formData: CcaSessionFormData): Promise<boolean> => {
      setSaving(true);
      try {
        const { data: insertedSession, error: insertError } = await supabase
          .from("cca_sessions")
          .insert({
            activity_id: activityId,
            session_date: formData.sessionDate,
            start_time: formData.startTime || null,
            end_time: formData.endTime || null,
            location_id: formData.locationId || null,
            location: formData.location || null,
            custom_title: formData.customTitle || null,
            description: formData.description || null,
            requirements: formData.requirements || null,
            is_cancelled: false,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.message.includes("row-level security")) {
            toast({
              title: "Permission Denied",
              description: "Only PIC teachers can create sessions for this activity.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: insertError.message,
              variant: "destructive",
            });
          }
          return false;
        }

        // Create notification for CCA session
        if (insertedSession) {
          const { data: activity } = await supabase
            .from("cca_activities")
            .select("name")
            .eq("id", activityId)
            .single();

          const sessionDate = new Date(formData.sessionDate);
          const dateStr = sessionDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
          const formatTime = (t: string | null) => {
            if (!t) return "";
            const [h, m] = t.split(":");
            const hour = parseInt(h);
            const ampm = hour >= 12 ? "PM" : "AM";
            return `${hour % 12 || 12}:${m} ${ampm}`;
          };
          const timeStr = formData.startTime 
            ? formData.endTime 
              ? `${formatTime(formData.startTime)}–${formatTime(formData.endTime)}`
              : formatTime(formData.startTime)
            : "All Day";

          const notificationMessage = `${activity?.name || "CCA"} session scheduled for ${dateStr}, ${timeStr}.`;

          // Get PIC teachers for this activity
          const { data: picTeachers } = await supabase
            .from("cca_activity_teachers")
            .select("teacher_user_id")
            .eq("activity_id", activityId);

          // Insert notifications for PIC teachers
          if (picTeachers && picTeachers.length > 0) {
            const notifications = picTeachers.map((t) => ({
              user_id: t.teacher_user_id,
              title: "CCA Session Created",
              message: notificationMessage,
              type: "event",
              link_to: "/teacher/calendar",
            }));
            await supabase.from("notifications").insert(notifications);
          }
        }

        toast({
          title: "Session saved",
          description: "The session has been created successfully.",
        });
        await fetchSessions();
        return true;
      } catch (err: any) {
        console.error("[useCcaSessions] createSession error:", err);
        toast({
          title: "Error",
          description: err?.message || "Failed to create session",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [activityId, fetchSessions]
  );

  const updateSession = useCallback(
    async (sessionId: string, formData: CcaSessionFormData): Promise<boolean> => {
      setSaving(true);
      try {
        const { error: updateError } = await supabase
          .from("cca_sessions")
          .update({
            session_date: formData.sessionDate,
            start_time: formData.startTime || null,
            end_time: formData.endTime || null,
            location_id: formData.locationId || null,
            location: formData.location || null,
            custom_title: formData.customTitle || null,
            description: formData.description || null,
            requirements: formData.requirements || null,
          })
          .eq("id", sessionId);

        if (updateError) {
          if (updateError.message.includes("row-level security")) {
            toast({
              title: "Permission Denied",
              description: "Only PIC teachers can edit sessions for this activity.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: updateError.message,
              variant: "destructive",
            });
          }
          return false;
        }

        toast({
          title: "Session saved",
          description: "The session has been updated successfully.",
        });
        await fetchSessions();
        return true;
      } catch (err: any) {
        console.error("[useCcaSessions] updateSession error:", err);
        toast({
          title: "Error",
          description: err?.message || "Failed to update session",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchSessions]
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setSaving(true);
      try {
        const { error: deleteError } = await supabase
          .from("cca_sessions")
          .delete()
          .eq("id", sessionId);

        if (deleteError) {
          if (deleteError.message.includes("row-level security")) {
            toast({
              title: "Permission Denied",
              description: "Only PIC teachers can delete sessions for this activity.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: deleteError.message,
              variant: "destructive",
            });
          }
          return false;
        }

        toast({
          title: "Session deleted",
          description: "The session has been removed.",
        });
        await fetchSessions();
        return true;
      } catch (err: any) {
        console.error("[useCcaSessions] deleteSession error:", err);
        toast({
          title: "Error",
          description: err?.message || "Failed to delete session",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchSessions]
  );

  const cancelSession = useCallback(
    async (sessionId: string, isCancelled: boolean): Promise<boolean> => {
      setSaving(true);
      try {
        const { error: updateError } = await supabase
          .from("cca_sessions")
          .update({ is_cancelled: isCancelled })
          .eq("id", sessionId);

        if (updateError) {
          toast({
            title: "Error",
            description: updateError.message,
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: isCancelled ? "Session cancelled" : "Session restored",
          description: isCancelled
            ? "The session has been marked as cancelled."
            : "The session has been restored.",
        });
        await fetchSessions();
        return true;
      } catch (err: any) {
        console.error("[useCcaSessions] cancelSession error:", err);
        toast({
          title: "Error",
          description: err?.message || "Failed to update session",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchSessions]
  );

  return {
    sessions,
    loading,
    saving,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
  };
}
