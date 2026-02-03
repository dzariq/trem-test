import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface EnrollmentEligibility {
  isEligible: boolean;
  studentYearLevel: string | null;
  studentKeyStage: string | null;
  activityYearLevels: string[] | null;
  errorMessage: string | null;
}

interface UseCcaEnrollmentOptions {
  studentId: string | null;
  onEnrollmentSuccess?: () => void;
}

/**
 * Hook for managing CCA enrollment with server-side eligibility validation.
 * Uses the validate_cca_enrollment_eligibility RPC function for security.
 */
export function useCcaEnrollment({ studentId, onEnrollmentSuccess }: UseCcaEnrollmentOptions) {
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  /**
   * Check if a student is eligible to enroll in a CCA activity.
   * This calls the server-side RPC function for secure validation.
   */
  const checkEligibility = useCallback(
    async (activityId: string): Promise<EnrollmentEligibility> => {
      if (!studentId) {
        return {
          isEligible: false,
          studentYearLevel: null,
          studentKeyStage: null,
          activityYearLevels: null,
          errorMessage: "No student selected",
        };
      }

      setCheckingEligibility(true);
      try {
        const { data, error } = await supabase.rpc("validate_cca_enrollment_eligibility", {
          p_student_id: studentId,
          p_activity_id: activityId,
        });

        if (error) {
          console.error("[useCcaEnrollment] RPC error:", error);
          return {
            isEligible: false,
            studentYearLevel: null,
            studentKeyStage: null,
            activityYearLevels: null,
            errorMessage: "Failed to check eligibility. Please try again.",
          };
        }

        // RPC returns a table, so data is an array
        const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!result) {
          return {
            isEligible: false,
            studentYearLevel: null,
            studentKeyStage: null,
            activityYearLevels: null,
            errorMessage: "Unable to verify eligibility",
          };
        }

        return {
          isEligible: result.is_eligible,
          studentYearLevel: result.student_year_level,
          studentKeyStage: result.student_key_stage,
          activityYearLevels: result.activity_year_levels,
          errorMessage: result.error_message,
        };
      } catch (err) {
        console.error("[useCcaEnrollment] Check eligibility error:", err);
        return {
          isEligible: false,
          studentYearLevel: null,
          studentKeyStage: null,
          activityYearLevels: null,
          errorMessage: "An error occurred while checking eligibility",
        };
      } finally {
        setCheckingEligibility(false);
      }
    },
    [studentId]
  );

  /**
   * Enroll a student in a CCA activity.
   * First validates eligibility server-side, then creates the enrollment.
   */
  const enrollInActivity = useCallback(
    async (activityId: string): Promise<boolean> => {
      if (!studentId) {
        toast({
          title: "Error",
          description: "No student selected",
          variant: "destructive",
        });
        return false;
      }

      setEnrolling(true);
      try {
        // Step 1: Validate eligibility server-side
        const eligibility = await checkEligibility(activityId);
        if (!eligibility.isEligible) {
          toast({
            title: "Not Eligible",
            description: eligibility.errorMessage || "You are not eligible for this activity.",
            variant: "destructive",
          });
          return false;
        }

        // Step 2: Check if already enrolled
        const { data: existingEnrollment, error: checkError } = await supabase
          .from("student_cca_enrollments")
          .select("id, status")
          .eq("student_id", studentId)
          .eq("cca_activity_id", activityId)
          .maybeSingle();

        if (checkError) {
          console.error("[useCcaEnrollment] Check existing enrollment error:", checkError);
          toast({
            title: "Error",
            description: "Failed to check enrollment status",
            variant: "destructive",
          });
          return false;
        }

        if (existingEnrollment) {
          if (existingEnrollment.status === "enrolled" || existingEnrollment.status === "active") {
            toast({
              title: "Already Enrolled",
              description: "You are already enrolled in this activity.",
              variant: "default",
            });
            return false;
          }

          // Re-enroll (update status)
          const { error: updateError } = await supabase
            .from("student_cca_enrollments")
            .update({ status: "enrolled", updated_at: new Date().toISOString() })
            .eq("id", existingEnrollment.id);

          if (updateError) {
            console.error("[useCcaEnrollment] Re-enroll error:", updateError);
            toast({
              title: "Enrollment Failed",
              description: "You don't have access to enroll in this activity.",
              variant: "destructive",
            });
            return false;
          }

          toast({
            title: "Enrolled!",
            description: "You have been re-enrolled in this activity.",
          });
          onEnrollmentSuccess?.();
          return true;
        }

        // Step 3: Create new enrollment
        const { error: insertError } = await supabase.from("student_cca_enrollments").insert({
          student_id: studentId,
          cca_activity_id: activityId,
          status: "enrolled",
        });

        if (insertError) {
          console.error("[useCcaEnrollment] Insert error:", insertError);
          if (insertError.message?.includes("row-level security")) {
            toast({
              title: "Access Denied",
              description: "You don't have access to enroll in this activity.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Enrollment Failed",
              description: insertError.message || "Failed to enroll",
              variant: "destructive",
            });
          }
          return false;
        }

        toast({
          title: "Enrolled!",
          description: "Successfully enrolled in the activity.",
        });
        onEnrollmentSuccess?.();
        return true;
      } catch (err) {
        console.error("[useCcaEnrollment] Enroll error:", err);
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
    [studentId, checkEligibility, onEnrollmentSuccess]
  );

  /**
   * Withdraw from a CCA activity.
   */
  const withdrawFromActivity = useCallback(
    async (enrollmentId: string): Promise<boolean> => {
      if (!studentId) {
        toast({
          title: "Error",
          description: "No student selected",
          variant: "destructive",
        });
        return false;
      }

      setEnrolling(true);
      try {
        const { error } = await supabase
          .from("student_cca_enrollments")
          .update({ status: "withdrawn", updated_at: new Date().toISOString() })
          .eq("id", enrollmentId)
          .eq("student_id", studentId);

        if (error) {
          console.error("[useCcaEnrollment] Withdraw error:", error);
          toast({
            title: "Withdrawal Failed",
            description: error.message || "Failed to withdraw",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Withdrawn",
          description: "Successfully withdrawn from the activity.",
        });
        onEnrollmentSuccess?.();
        return true;
      } catch (err) {
        console.error("[useCcaEnrollment] Withdraw error:", err);
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
    [studentId, onEnrollmentSuccess]
  );

  return {
    enrollInActivity,
    withdrawFromActivity,
    checkEligibility,
    enrolling,
    checkingEligibility,
  };
}
