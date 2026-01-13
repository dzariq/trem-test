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

      // Get subjects that the student has grades for
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
        throw gradesError;
      }

      console.log("[useStudentGradeGoals] Raw grades data:", gradesData);

      // Get the latest grade per subject (by sort_order desc)
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

      console.log("[useStudentGradeGoals] Latest grades by subject:", Object.fromEntries(latestGradesBySubject));

      // Get existing goals for this student and year
      const { data: goalsData, error: goalsError } = await supabase
        .from("student_grade_goals")
        .select("subject_id, target_percentage")
        .eq("student_id", studentId)
        .eq("goal_year", goalYear);

      if (goalsError) {
        console.error("[useStudentGradeGoals] Error fetching goals:", goalsError);
        throw goalsError;
      }

      console.log("[useStudentGradeGoals] Existing goals:", goalsData);

      // Create a map of subject_id -> target_percentage
      const goalsMap = new Map<number, number>();
      if (goalsData) {
        for (const goal of goalsData) {
          goalsMap.set(goal.subject_id, goal.target_percentage);
        }
      }

      // Build the final goals array
      const subjectGoals: SubjectGoal[] = [];
      for (const [subjectId, gradeInfo] of latestGradesBySubject) {
        const currentPercentage = gradeInfo.totalMarks;
        const targetPercentage = goalsMap.get(subjectId) ?? null;
        const achieved = currentPercentage !== null && targetPercentage !== null && currentPercentage >= targetPercentage;
        const deltaToGo = targetPercentage !== null && currentPercentage !== null 
          ? Math.max(0, targetPercentage - currentPercentage) 
          : 0;

        subjectGoals.push({
          subjectId,
          subjectName: gradeInfo.subjectName,
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

      const { error: upsertError } = await supabase
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
        );

      if (upsertError) {
        console.error("[useStudentGradeGoals] Upsert error:", upsertError);
        throw upsertError;
      }

      console.log("[useStudentGradeGoals] Goal saved successfully");

      // Update local state immediately
      setGoals(prev => prev.map(g => {
        if (g.subjectId === subjectId) {
          const achieved = g.currentPercentage !== null && g.currentPercentage >= targetPercentage;
          const deltaToGo = g.currentPercentage !== null ? Math.max(0, targetPercentage - g.currentPercentage) : 0;
          return { ...g, targetPercentage, achieved, deltaToGo };
        }
        return g;
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save goal.";
      console.error("[useStudentGradeGoals] Save error:", err);
      setError(message);
    } finally {
      setSavingGoalId(null);
    }
  }, [studentId, goalYear]);

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
