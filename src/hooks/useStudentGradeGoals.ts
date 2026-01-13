import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubjectGoal {
  subjectId: number;
  subjectName: string;
  currentPercentage: number | null;
  targetPercentage: number | null;
  achieved: boolean;
  deltaToGo: number;
}

interface GoalCounters {
  achievedCount: number;
  onTrackCount: number;
  needsFocusCount: number;
}

export function useStudentGradeGoals(studentId: string | null, goalYear: number) {
  const [goals, setGoals] = useState<SubjectGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGoalId, setSavingGoalId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects, grades, and goals for the student
  const fetchGoalsData = useCallback(async () => {
    if (!studentId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[useStudentGradeGoals] Fetching data for studentId:", studentId, "goalYear:", goalYear);

      // 1) Fetch existing goals for this student and year FIRST
      const { data: goalsData, error: goalsError } = await supabase
        .from("student_grade_goals")
        .select("id, student_id, subject_id, goal_year, target_percentage")
        .eq("student_id", studentId)
        .eq("goal_year", goalYear)
        .order("subject_id", { ascending: true });

      if (goalsError) {
        console.error("[useStudentGradeGoals] Error fetching goals:", {
          message: goalsError.message,
          code: goalsError.code,
          details: goalsError.details,
          hint: goalsError.hint
        });
        throw goalsError;
      }

      console.log("[useStudentGradeGoals] Existing goals from DB:", goalsData);

      // 2) Get all subject IDs that have goals
      const subjectIdsWithGoals = new Set((goalsData ?? []).map(g => g.subject_id));

      // 3) Get subjects that the student has grades for
      const { data: gradesData, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          subject_id,
          total_marks,
          academic_period_id,
          subjects!inner(id, name),
          academic_periods!inner(id, code, sort_order)
        `)
        .eq("student_id", studentId);

      if (gradesError) {
        console.error("[useStudentGradeGoals] Error fetching grades:", gradesError);
        // Don't throw - we can still show goals without grades
      }

      console.log("[useStudentGradeGoals] Raw grades data:", gradesData);

      // 4) Get the latest grade per subject (by sort_order desc)
      const latestGradesBySubject = new Map<number, { subjectName: string; totalMarks: number | null }>();
      
      if (gradesData) {
        // Sort by sort_order descending to get latest first
        const sortedGrades = [...gradesData].sort((a, b) => {
          const sortA = (a.academic_periods as any)?.sort_order ?? 0;
          const sortB = (b.academic_periods as any)?.sort_order ?? 0;
          return sortB - sortA;
        });

        for (const grade of sortedGrades) {
          const subjectId = grade.subject_id;
          if (!latestGradesBySubject.has(subjectId)) {
            latestGradesBySubject.set(subjectId, {
              subjectName: (grade.subjects as any)?.name ?? `Subject ${subjectId}`,
              totalMarks: grade.total_marks
            });
          }
        }
      }

      // 5) Fetch subject names for goals that don't have grades
      const missingSubjectIds = [...subjectIdsWithGoals].filter(id => !latestGradesBySubject.has(id));
      if (missingSubjectIds.length > 0) {
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id, name")
          .in("id", missingSubjectIds);
        
        if (subjectsData) {
          for (const subj of subjectsData) {
            if (!latestGradesBySubject.has(subj.id)) {
              latestGradesBySubject.set(subj.id, {
                subjectName: subj.name,
                totalMarks: null
              });
            }
          }
        }
      }

      console.log("[useStudentGradeGoals] Latest grades by subject:", Object.fromEntries(latestGradesBySubject));

      // 6) Create a map of subject_id -> target_percentage
      const goalsMap = new Map<number, number>();
      if (goalsData) {
        for (const goal of goalsData) {
          goalsMap.set(goal.subject_id, goal.target_percentage);
        }
      }

      // 7) Build the final goals array - include ALL subjects from both grades AND goals
      const allSubjectIds = new Set([...latestGradesBySubject.keys(), ...subjectIdsWithGoals]);
      const subjectGoals: SubjectGoal[] = [];

      for (const subjectId of allSubjectIds) {
        const gradeInfo = latestGradesBySubject.get(subjectId);
        const currentPercentage = gradeInfo?.totalMarks ?? null;
        const targetPercentage = goalsMap.get(subjectId) ?? null;
        const achieved = currentPercentage !== null && targetPercentage !== null && currentPercentage >= targetPercentage;
        const deltaToGo = targetPercentage !== null && currentPercentage !== null 
          ? Math.max(0, targetPercentage - currentPercentage) 
          : 0;

        subjectGoals.push({
          subjectId,
          subjectName: gradeInfo?.subjectName ?? `Subject ${subjectId}`,
          currentPercentage,
          targetPercentage,
          achieved,
          deltaToGo
        });
      }

      // Sort by subject name
      subjectGoals.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      console.log("[useStudentGradeGoals] Final goals array:", subjectGoals);
      setGoals(subjectGoals);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load goals data.";
      console.error("[useStudentGradeGoals] Error:", err);
      setError(message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, goalYear]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  // Upsert a single goal
  const upsertGoal = useCallback(async (subjectId: number, targetPercentage: number) => {
    if (!studentId) return;

    setSavingGoalId(subjectId);
    setError(null);

    try {
      console.log("[useStudentGradeGoals] Upserting goal:", { studentId, subjectId, goalYear, targetPercentage });

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Try upsert without created_by first (let DB default handle it)
      const { data: upsertData, error: upsertError } = await supabase
        .from("student_grade_goals")
        .upsert(
          {
            student_id: studentId,
            subject_id: subjectId,
            goal_year: goalYear,
            target_percentage: targetPercentage,
            updated_at: new Date().toISOString()
          },
          { onConflict: "student_id,subject_id,goal_year" }
        )
        .select();

      if (upsertError) {
        console.error("[useStudentGradeGoals] Upsert error details:", {
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint
        });
        
        // If it fails due to created_by being required, retry with created_by
        if (upsertError.message?.includes("created_by") || upsertError.code === "23502") {
          console.log("[useStudentGradeGoals] Retrying with created_by...");
          const { data: retryData, error: retryError } = await supabase
            .from("student_grade_goals")
            .upsert(
              {
                student_id: studentId,
                subject_id: subjectId,
                goal_year: goalYear,
                target_percentage: targetPercentage,
                created_by: userId,
                updated_at: new Date().toISOString()
              },
              { onConflict: "student_id,subject_id,goal_year" }
            )
            .select();

          if (retryError) {
            console.error("[useStudentGradeGoals] Retry upsert error details:", {
              message: retryError.message,
              code: retryError.code,
              details: retryError.details,
              hint: retryError.hint
            });
            throw retryError;
          }
          console.log("[useStudentGradeGoals] Goal saved successfully (with created_by):", retryData);
        } else {
          throw upsertError;
        }
      } else {
        console.log("[useStudentGradeGoals] Goal saved successfully:", upsertData);
      }

      // Refetch goals to ensure UI is in sync
      await fetchGoalsData();
    } catch (err) {
      const supaError = err as { message?: string; code?: string; details?: string; hint?: string };
      const message = supaError.message || "Failed to save goal.";
      console.error("[useStudentGradeGoals] Save error:", err);
      setError(message);
    } finally {
      setSavingGoalId(null);
    }
  }, [studentId, goalYear, fetchGoalsData]);

  // Computed counters
  const counters = useMemo<GoalCounters>(() => {
    const goalsWithTargets = goals.filter(g => g.targetPercentage !== null);
    
    const achievedCount = goalsWithTargets.filter(g => g.achieved).length;
    
    // On Track: within 30% of target, i.e. (target - current) / target <= 0.30
    const onTrackCount = goalsWithTargets.filter(g => {
      if (g.achieved) return false;
      if (g.targetPercentage === null || g.currentPercentage === null) return false;
      const relativeGap = (g.targetPercentage - g.currentPercentage) / g.targetPercentage;
      return relativeGap <= 0.30;
    }).length;
    
    // Needs Focus: >30% away from target
    const needsFocusCount = goalsWithTargets.filter(g => {
      if (g.achieved) return false;
      if (g.targetPercentage === null || g.currentPercentage === null) return false;
      const relativeGap = (g.targetPercentage - g.currentPercentage) / g.targetPercentage;
      return relativeGap > 0.30;
    }).length;

    return { achievedCount, onTrackCount, needsFocusCount };
  }, [goals]);

  return {
    goals,
    loading,
    savingGoalId,
    error,
    refetch: fetchGoalsData,
    upsertGoal,
    ...counters
  };
}
