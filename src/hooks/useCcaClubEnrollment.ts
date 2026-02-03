import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface ClubEnrollmentResult {
  success: boolean;
  error?: string;
  previousClub?: { id: string; name: string } | null;
}

interface UseCcaClubEnrollmentOptions {
  studentId: string | null;
  onSuccess?: () => void;
}

/**
 * Hook for self-service CCA club enrollment (join/switch).
 * Uses validate_cca_enrollment_eligibility RPC for server-side validation.
 */
export function useCcaClubEnrollment({ studentId, onSuccess }: UseCcaClubEnrollmentOptions) {
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  /**
   * Check if student is eligible for a specific activity
   */
  const checkEligibility = useCallback(
    async (activityId: string) => {
      if (!studentId) {
        return { isEligible: false, error: "No student selected" };
      }

      setCheckingEligibility(true);
      try {
        const { data, error } = await supabase.rpc("validate_cca_enrollment_eligibility", {
          p_student_id: studentId,
          p_activity_id: activityId,
        });

        if (error) {
          console.error("[useCcaClubEnrollment] eligibility check error:", error);
          return { isEligible: false, error: "Failed to check eligibility" };
        }

        const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!result) {
          return { isEligible: false, error: "Unable to verify eligibility" };
        }

        return {
          isEligible: result.is_eligible,
          error: result.error_message || undefined,
          studentYearLevel: result.student_year_level,
          activityYearLevels: result.activity_year_levels,
        };
      } catch (err) {
        console.error("[useCcaClubEnrollment] eligibility check exception:", err);
        return { isEligible: false, error: "An error occurred" };
      } finally {
        setCheckingEligibility(false);
      }
    },
    [studentId]
  );

  /**
   * Get the student's current enrolled club (if any)
   * Valid statuses: 'active', 'inactive', 'pending'
   */
  const getCurrentEnrolledClub = useCallback(async (): Promise<{ id: string; name: string } | null> => {
    if (!studentId) return null;

    const { data, error } = await supabase
      .from("student_cca_enrollments")
      .select(`
        id,
        cca_activity_id,
        status,
        cca_activities(id, name)
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.cca_activity_id,
      name: (data.cca_activities as any)?.name || "Unknown Club",
    };
  }, [studentId]);

  /**
   * Join a new club (for students not currently enrolled in any)
   */
  const joinClub = useCallback(
    async (activityId: string, activityName: string): Promise<ClubEnrollmentResult> => {
      if (!studentId) {
        toast({ title: "Error", description: "No student selected", variant: "destructive" });
        return { success: false, error: "No student selected" };
      }

      setEnrolling(true);
      try {
        // Validate eligibility server-side
        const eligibility = await checkEligibility(activityId);
        if (!eligibility.isEligible) {
          toast({
            title: "Not Eligible",
            description: eligibility.error || "You are not eligible for this club",
            variant: "destructive",
          });
          return { success: false, error: eligibility.error };
        }

        // First, deactivate any existing active enrollments (enforce 1 active club rule)
        const { error: deactivateError } = await supabase
          .from("student_cca_enrollments")
          .update({ status: "inactive" })
          .eq("student_id", studentId)
          .eq("status", "active");

        if (deactivateError) {
          console.error("[useCcaClubEnrollment] deactivate error:", deactivateError);
        }

        // Check for existing enrollment record for this specific club
        const { data: existing } = await supabase
          .from("student_cca_enrollments")
          .select("id, status")
          .eq("student_id", studentId)
          .eq("cca_activity_id", activityId)
          .maybeSingle();

        if (existing) {
          if (existing.status === "active") {
            toast({
              title: "Already Enrolled",
              description: "You are already enrolled in this club",
            });
            return { success: false, error: "Already enrolled" };
          }

          // Re-activate by updating status to 'active'
          const { error: updateError } = await supabase
            .from("student_cca_enrollments")
            .update({ status: "active" })
            .eq("id", existing.id);

          if (updateError) {
            console.error("[useCcaClubEnrollment] re-enroll error:", updateError);
            toast({
              title: "Enrollment Failed",
              description: "Unable to enroll in this club",
              variant: "destructive",
            });
            return { success: false, error: updateError.message };
          }
        } else {
          // Create new enrollment with status 'active'
          const { error: insertError } = await supabase.from("student_cca_enrollments").insert({
            student_id: studentId,
            cca_activity_id: activityId,
            status: "active",
          });

          if (insertError) {
            console.error("[useCcaClubEnrollment] insert error:", insertError);
            toast({
              title: "Enrollment Failed",
              description: "Unable to enroll in this club",
              variant: "destructive",
            });
            return { success: false, error: insertError.message };
          }
        }

        toast({
          title: "Joined!",
          description: `Successfully joined ${activityName}`,
        });
        onSuccess?.();
        return { success: true };
      } catch (err: any) {
        console.error("[useCcaClubEnrollment] join error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return { success: false, error: err?.message };
      } finally {
        setEnrolling(false);
      }
    },
    [studentId, checkEligibility, onSuccess]
  );

  /**
   * Switch from current club to a new club
   * This withdraws from the current club and enrolls in the new one
   */
  const switchClub = useCallback(
    async (
      newActivityId: string,
      newActivityName: string
    ): Promise<ClubEnrollmentResult> => {
      if (!studentId) {
        toast({ title: "Error", description: "No student selected", variant: "destructive" });
        return { success: false, error: "No student selected" };
      }

      setEnrolling(true);
      try {
        // Validate eligibility for new club
        const eligibility = await checkEligibility(newActivityId);
        if (!eligibility.isEligible) {
          toast({
            title: "Not Eligible",
            description: eligibility.error || "You are not eligible for this club",
            variant: "destructive",
          });
          return { success: false, error: eligibility.error };
        }

        // Get current enrollment
        const currentClub = await getCurrentEnrolledClub();

        // If already in same club, do nothing
        if (currentClub?.id === newActivityId) {
          toast({
            title: "Already Enrolled",
            description: "You are already in this club",
          });
          return { success: false, error: "Already in this club" };
        }

        // Deactivate all currently active enrollments (enforce 1 active club rule)
        const { error: deactivateError } = await supabase
          .from("student_cca_enrollments")
          .update({ status: "inactive" })
          .eq("student_id", studentId)
          .eq("status", "active");

        if (deactivateError) {
          console.error("[useCcaClubEnrollment] deactivate error:", deactivateError);
          toast({
            title: "Switch Failed",
            description: "Unable to leave current club",
            variant: "destructive",
          });
          return { success: false, error: deactivateError.message };
        }

        // Check for existing enrollment record for new club
        const { data: existing } = await supabase
          .from("student_cca_enrollments")
          .select("id, status")
          .eq("student_id", studentId)
          .eq("cca_activity_id", newActivityId)
          .maybeSingle();

        if (existing) {
          // Update existing record to 'active'
          const { error: updateError } = await supabase
            .from("student_cca_enrollments")
            .update({ status: "active" })
            .eq("id", existing.id);

          if (updateError) {
            console.error("[useCcaClubEnrollment] update error:", updateError);
            toast({
              title: "Switch Failed",
              description: "Unable to join new club",
              variant: "destructive",
            });
            return { success: false, error: updateError.message };
          }
        } else {
          // Create new enrollment with status 'active'
          const { error: insertError } = await supabase.from("student_cca_enrollments").insert({
            student_id: studentId,
            cca_activity_id: newActivityId,
            status: "active",
          });

          if (insertError) {
            console.error("[useCcaClubEnrollment] insert error:", insertError);
            toast({
              title: "Switch Failed",
              description: "Unable to join new club",
              variant: "destructive",
            });
            return { success: false, error: insertError.message };
          }
        }

        toast({
          title: "Club Changed!",
          description: currentClub
            ? `Switched from ${currentClub.name} to ${newActivityName}`
            : `Joined ${newActivityName}`,
        });
        onSuccess?.();
        return { success: true, previousClub: currentClub };
      } catch (err: any) {
        console.error("[useCcaClubEnrollment] switch error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return { success: false, error: err?.message };
      } finally {
        setEnrolling(false);
      }
    },
    [studentId, checkEligibility, getCurrentEnrolledClub, onSuccess]
  );

  /**
   * Withdraw from a club (set to inactive)
   */
  const withdrawFromClub = useCallback(
    async (activityId: string): Promise<boolean> => {
      if (!studentId) {
        toast({ title: "Error", description: "No student selected", variant: "destructive" });
        return false;
      }

      setEnrolling(true);
      try {
        const { error } = await supabase
          .from("student_cca_enrollments")
          .update({ status: "inactive" })
          .eq("student_id", studentId)
          .eq("cca_activity_id", activityId)
          .eq("status", "active");

        if (error) {
          console.error("[useCcaClubEnrollment] withdraw error:", error);
          toast({
            title: "Withdrawal Failed",
            description: "Unable to leave this club",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Left Club",
          description: "You have been removed from this club",
        });
        onSuccess?.();
        return true;
      } catch (err) {
        console.error("[useCcaClubEnrollment] withdraw error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setEnrolling(false);
      }
    },
    [studentId, onSuccess]
  );

  return {
    joinClub,
    switchClub,
    withdrawFromClub,
    checkEligibility,
    getCurrentEnrolledClub,
    enrolling,
    checkingEligibility,
  };
}
