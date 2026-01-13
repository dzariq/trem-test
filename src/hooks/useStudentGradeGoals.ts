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

  const getAssignedSubjects = useCallback(async (studentIdValue: string) => {
    const supabaseAny = supabase as unknown as {
      from: (table: string) => any;
    };

    const { data: selectionsData, error: selectionsError } = await supabaseAny
      .from("subject_selections")
      .select("subjects")
      .eq("student_id", studentIdValue)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectionsError) {
      console.error("[useStudentGradeGoals] subject_selections lookup failed:", {
        code: selectionsError.code,
        message: selectionsError.message,
        details: selectionsError.details
      });
      throw selectionsError;
    }

    if (import.meta.env.DEV) {
      console.log("subject_selections rows:", selectionsData?.length, selectionsData?.[0]);
      console.log(
        "subjects len:",
        Array.isArray(selectionsData?.[0]?.subjects) ? selectionsData?.[0]?.subjects.length : null
      );
    }

    const subjects = selectionsData?.[0]?.subjects;
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return { assignedSubjects: [], hasSubjectsArray: false };
    }

    const assigned: { subjectId: number; subjectName: string }[] = [];
    const seen = new Set<number>();

    for (const subject of subjects) {
      const subjectId = Number((subject as any)?.id);
      if (!Number.isFinite(subjectId) || !Number.isInteger(subjectId) || seen.has(subjectId)) {
        continue;
      }
      const selected = (subject as any)?.selected;
      const compulsory = (subject as any)?.compulsory;
      if (selected !== true && !(selected === undefined && compulsory === true)) {
        continue;
      }
      seen.add(subjectId);
      assigned.push({
        subjectId,
        subjectName: String((subject as any)?.name ?? `Subject ${subjectId}`)
      });
    }

    if (import.meta.env.DEV) {
      console.log("[useStudentGradeGoals] Assigned subjects count:", assigned.length);
    }

    return { assignedSubjects: assigned, hasSubjectsArray: true };
  }, []);

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

      // 1) Fetch assigned subjects for the student
      const { assignedSubjects, hasSubjectsArray } = await getAssignedSubjects(studentId);

      if (assignedSubjects.length === 0) {
        if (!hasSubjectsArray) {
          setError("No subjects assigned to this student yet.");
        }
        setGoals([]);
        setLoading(false);
        return;
      }

      const assignedSubjectIds = assignedSubjects.map(s => s.subjectId);
      const assignedSubjectsMap = new Map<number, string>(
        assignedSubjects.map(subject => [subject.subjectId, subject.subjectName])
      );

      // 2) Fetch existing goals for this student and year
      const { data: goalsData, error: goalsError } = await supabase
        .from("student_grade_goals")
        .select("id, student_id, subject_id, goal_year, target_percentage")
        .eq("student_id", studentId)
        .eq("goal_year", goalYear)
        .in("subject_id", assignedSubjectIds)
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

      if (import.meta.env.DEV) {
        console.log("[useStudentGradeGoals] Existing goals count:", goalsData?.length ?? 0);
      }

      // 2b) Seed default goals if none exist for this year
      if ((goalsData?.length ?? 0) === 0) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        const seedPayload = assignedSubjectIds.map(subjectId => ({
          student_id: studentId,
          subject_id: subjectId,
          goal_year: goalYear,
          target_percentage: 75,
          created_by: userId
        }));

        const { error: seedError } = await supabase
          .from("student_grade_goals")
          .upsert(seedPayload, { onConflict: "student_id,subject_id,goal_year" });

        if (seedError) {
          console.error("[useStudentGradeGoals] Seed goals error:", {
            code: seedError.code,
            message: seedError.message,
            details: seedError.details,
            hint: seedError.hint
          });
          throw seedError;
        }
      }

      const { data: refreshedGoals, error: refreshedGoalsError } = await supabase
        .from("student_grade_goals")
        .select("id, student_id, subject_id, goal_year, target_percentage")
        .eq("student_id", studentId)
        .eq("goal_year", goalYear)
        .in("subject_id", assignedSubjectIds)
        .order("subject_id", { ascending: true });

      if (refreshedGoalsError) {
        console.error("[useStudentGradeGoals] Error refreshing goals:", {
          message: refreshedGoalsError.message,
          code: refreshedGoalsError.code,
          details: refreshedGoalsError.details,
          hint: refreshedGoalsError.hint
        });
        throw refreshedGoalsError;
      }

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
        .eq("student_id", studentId)
        .in("subject_id", assignedSubjectIds);

      if (gradesError) {
        console.error("[useStudentGradeGoals] Error fetching grades:", gradesError);
        // Don't throw - we can still show goals without grades
      }

      console.log("[useStudentGradeGoals] Raw grades data:", gradesData);

      // 4) Get the latest grade per subject (by sort_order desc)
      const latestGradesBySubject = new Map<number, number | null>();
      
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
            latestGradesBySubject.set(subjectId, grade.total_marks);
          }
        }
      }

      console.log("[useStudentGradeGoals] Latest grades by subject:", Object.fromEntries(latestGradesBySubject));

      // 5) Build a map of subject_id -> target_percentage
      const goalsMap = new Map<number, number>();
      if (refreshedGoals) {
        for (const goal of refreshedGoals) {
          goalsMap.set(goal.subject_id, goal.target_percentage);
        }
      }

      // 6) Build the final goals array from assigned subjects (grades are optional enrichment)
      const subjectGoals: SubjectGoal[] = [];

      for (const subjectId of assignedSubjectIds) {
        const currentPercentage = latestGradesBySubject.get(subjectId) ?? null;
        const targetPercentage = goalsMap.get(subjectId) ?? null;
        const achieved = currentPercentage !== null && targetPercentage !== null && currentPercentage >= targetPercentage;
        const deltaToGo = targetPercentage !== null && currentPercentage !== null 
          ? Math.max(0, targetPercentage - currentPercentage) 
          : 0;

        subjectGoals.push({
          subjectId,
          subjectName: assignedSubjectsMap.get(subjectId) ?? `Subject ${subjectId}`,
          currentPercentage,
          targetPercentage,
          achieved,
          deltaToGo
        });
      }

      // Sort by subject name
      subjectGoals.sort((a, b) => {
        const nameSort = a.subjectName.localeCompare(b.subjectName);
        return nameSort !== 0 ? nameSort : a.subjectId - b.subjectId;
      });

      if (import.meta.env.DEV) {
        console.log("[useStudentGradeGoals] Final goals count:", subjectGoals.length);
      }
      setGoals(subjectGoals);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load goals data.";
      console.error("[useStudentGradeGoals] Error:", err);
      setError(message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, goalYear, getAssignedSubjects]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  // Upsert a single goal
  const upsertGoal = useCallback(async (subjectId: number, targetPercentage: number) => {
    if (!studentId) return;

    setSavingGoalId(subjectId);
    setError(null);

    try {
      if (!Number.isFinite(targetPercentage)) {
        throw new Error("Invalid goal value.");
      }
      const clampedTarget = Math.min(100, Math.max(0, Math.round(targetPercentage)));
      if (import.meta.env.DEV) {
        console.log("[useStudentGradeGoals] Goal update payload:", {
          subjectId,
          year: goalYear,
          target_percentage: clampedTarget
        });
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data: upsertData, error: upsertError } = await supabase
        .from("student_grade_goals")
        .upsert(
          {
            student_id: studentId,
            subject_id: subjectId,
            goal_year: goalYear,
            target_percentage: clampedTarget,
            created_by: userId
          },
          { onConflict: "student_id,subject_id,goal_year" }
        )
        .select()
        .single();

      if (upsertError) {
        console.error("[useStudentGradeGoals] Upsert error details:", {
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint
        });
        throw upsertError;
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
