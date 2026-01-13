import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface AcademicPeriod {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
}

export interface SubjectGrade {
  id: string;
  subjectId: number;
  subjectName: string;
  subjectCategory: string | null;
  quizMarks: number;
  homeworkMarks: number;
  examMarks: number;
  attitudeMarks: number;
  totalMarks: number;
  letterGrade: string | null;
  subjectComment: string | null;
  teacherComment: string | null;
}

export interface BehaviorAssessment {
  id: string;
  attendanceRating: string | null;
  punctualityRating: string | null;
  cooperationRating: string | null;
  selfControlRating: string | null;
  responsibilityRating: string | null;
  initiativeRating: string | null;
  leadershipRating: string | null;
  achievementText: string | null;
  responsibilityText: string | null;
  homeroomTeacherComment: string | null;
}

export interface CocurricularActivity {
  id: string;
  academicPeriodId: string;
  sportsHouseOrg: string | null;
  sportsHouseRole: string | null;
  clubOrg: string | null;
  clubRole: string | null;
  leadershipOrg: string | null;
  leadershipRole: string | null;
  eventsOrg: string | null;
  eventsRole: string | null;
  achievementsEvent: string | null;
  achievementsAward: string | null;
}

export interface StudentReportCardData {
  grades: SubjectGrade[];
  behavior: BehaviorAssessment | null;
  cocurricular: CocurricularActivity[];
}

// Helper: derive letter grade from total marks
const getGradeFromScore = (score: number): string => {
  if (score >= 90) return "A*";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
};

// Helper: derive behavior grade from marks (assuming 0-100 scale)
const getBehaviorGrade = (marks: number | null): string => {
  if (marks === null) return "N/A";
  if (marks >= 90) return "A";
  if (marks >= 75) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "E";
};

export function useStudentReportCard(studentId: string | null, academicPeriodId: string | null) {
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [data, setData] = useState<StudentReportCardData>({
    grades: [],
    behavior: null,
    cocurricular: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch academic periods that have grades for this student
  useEffect(() => {
    const fetchPeriodsForStudent = async () => {
      console.log("[useStudentReportCard] fetchPeriodsForStudent called, studentId:", studentId);
      
      if (!studentId) {
        console.log("[useStudentReportCard] No studentId, clearing periods");
        setAcademicPeriods([]);
        return;
      }

      setPeriodsLoading(true);
      try {
        // Step 1: Get all academic_period_ids from student_grades for this student
        const { data: gradesData, error: gradesError } = await supabase
          .from("student_grades")
          .select("academic_period_id")
          .eq("student_id", studentId);

        console.log("[useStudentReportCard] student_grades query result:", { 
          gradesData, 
          gradesError,
          studentId 
        });

        if (gradesError) {
          console.error("[useStudentReportCard] student_grades query FAILED:", gradesError);
          // Fallback: get all active periods
          const { data: allPeriods, error: fallbackError } = await supabase
            .from("academic_periods")
            .select("id, name, code, sort_order, created_at")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          
          console.log("[useStudentReportCard] Fallback periods:", { allPeriods, fallbackError });
          
          setAcademicPeriods(
            (allPeriods || []).map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code || "",
              sortOrder: p.sort_order ?? 0,
            }))
          );
          return;
        }

        // Step 2: Build unique period IDs (filter out nulls)
        const uniquePeriodIds = [...new Set(
          (gradesData || [])
            .map(g => g.academic_period_id)
            .filter((id): id is string => id !== null && id !== undefined)
        )];
        
        console.log("[useStudentReportCard] uniquePeriodIds derived:", uniquePeriodIds);

        if (uniquePeriodIds.length === 0) {
          console.log("[useStudentReportCard] No period IDs found in grades, fetching all periods");
          // No grades yet, show all periods (not just active)
          const { data: allPeriods, error: allPeriodsError } = await supabase
            .from("academic_periods")
            .select("id, name, code, sort_order, created_at")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          
          console.log("[useStudentReportCard] All periods query:", { allPeriods, allPeriodsError });
          
          setAcademicPeriods(
            (allPeriods || []).map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code || "",
              sortOrder: p.sort_order ?? 0,
            }))
          );
          return;
        }

        // Step 3: Fetch period details for those IDs
        const { data: periods, error: periodsError } = await supabase
          .from("academic_periods")
          .select("id, name, code, sort_order, created_at")
          .in("id", uniquePeriodIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        console.log("[useStudentReportCard] academic_periods query result:", { 
          periods, 
          periodsError,
          queriedIds: uniquePeriodIds 
        });

        if (periodsError) {
          console.error("[useStudentReportCard] academic_periods query FAILED:", periodsError);
          throw periodsError;
        }

        const mappedPeriods = (periods || []).map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code || "",
          sortOrder: p.sort_order ?? 0,
        }));
        
        console.log("[useStudentReportCard] Final mapped periods:", mappedPeriods);
        setAcademicPeriods(mappedPeriods);
      } catch (err) {
        console.error("[useStudentReportCard] Error fetching periods (full error):", err);
        setAcademicPeriods([]);
      } finally {
        setPeriodsLoading(false);
      }
    };

    fetchPeriodsForStudent();
  }, [studentId]);

  // Fetch report card data for selected student and period
  const fetchReportCardData = useCallback(async () => {
    if (!studentId || !academicPeriodId) {
      setData({ grades: [], behavior: null, cocurricular: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch grades with subject info
      const { data: gradesData, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          id,
          subject_id,
          quiz_marks,
          homework_marks,
          exam_marks,
          attitude_marks,
          total_marks,
          letter_grade,
          subject_comment,
          teacher_comment,
          subjects:subject_id (id, name, category)
        `)
        .eq("student_id", studentId)
        .eq("academic_period_id", academicPeriodId);

      if (gradesError) {
        console.error("[useStudentReportCard] student_grades query failed:", gradesError);
        throw gradesError;
      }

      const grades: SubjectGrade[] = (gradesData || []).map((g: any) => ({
        id: g.id,
        subjectId: g.subject_id,
        subjectName: g.subjects?.name || `Subject ${g.subject_id}`,
        subjectCategory: g.subjects?.category || null,
        quizMarks: g.quiz_marks || 0,
        homeworkMarks: g.homework_marks || 0,
        examMarks: g.exam_marks || 0,
        attitudeMarks: g.attitude_marks || 0,
        totalMarks: g.total_marks || 0,
        letterGrade: g.letter_grade || (g.total_marks ? getGradeFromScore(g.total_marks) : null),
        subjectComment: g.subject_comment,
        teacherComment: g.teacher_comment,
      }));

      // Fetch behavior assessment
      const { data: behaviorData, error: behaviorError } = await supabase
        .from("behavioral_assessments")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_period_id", academicPeriodId)
        .maybeSingle();

      if (behaviorError) {
        console.error("[useStudentReportCard] behavioral_assessments query failed:", behaviorError);
      }

      const behavior: BehaviorAssessment | null = behaviorData
        ? {
            id: behaviorData.id,
            attendanceRating: behaviorData.attendance_rating,
            punctualityRating: behaviorData.punctuality_rating,
            cooperationRating: behaviorData.cooperation_rating,
            selfControlRating: behaviorData.self_control_rating,
            responsibilityRating: behaviorData.responsibility_rating,
            initiativeRating: behaviorData.initiative_rating,
            leadershipRating: behaviorData.leadership_rating,
            achievementText: behaviorData.achievement_text,
            responsibilityText: behaviorData.responsibility_text,
            homeroomTeacherComment: behaviorData.homeroom_teacher_comment,
          }
        : null;

      // Fetch ALL cocurricular activities for student (for year filter in Awards tab)
      const { data: cocurricularData, error: cocurricularError } = await supabase
        .from("student_cocurricular_activities")
        .select("*")
        .eq("student_id", studentId);

      if (cocurricularError) {
        console.error("[useStudentReportCard] student_cocurricular_activities query failed:", cocurricularError);
      }

      const cocurricular: CocurricularActivity[] = (cocurricularData || []).map((c: any) => ({
        id: c.id,
        academicPeriodId: c.academic_period_id,
        sportsHouseOrg: c.sports_house_org,
        sportsHouseRole: c.sports_house_role,
        clubOrg: c.club_org,
        clubRole: c.club_role,
        leadershipOrg: c.leadership_org,
        leadershipRole: c.leadership_role,
        eventsOrg: c.events_org,
        eventsRole: c.events_role,
        achievementsEvent: c.achievements_event,
        achievementsAward: c.achievements_award,
      }));

      setData({ grades, behavior, cocurricular });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load report card data";
      console.error("[useStudentReportCard] Error:", err);
      setError(message);
      setData({ grades: [], behavior: null, cocurricular: [] });
    } finally {
      setLoading(false);
    }
  }, [studentId, academicPeriodId]);

  useEffect(() => {
    fetchReportCardData();
  }, [fetchReportCardData]);

  // Computed: behavior items for UI - derive from grades if no behavioral_assessments
  const behaviorItems = useMemo(() => {
    // First try behavioral_assessments table
    if (data.behavior) {
      const ratingMap: Record<string, { category: string; grade: string }> = {
        attendanceRating: { category: "Attendance", grade: data.behavior.attendanceRating || "N/A" },
        punctualityRating: { category: "Punctuality", grade: data.behavior.punctualityRating || "N/A" },
        cooperationRating: { category: "Cooperation", grade: data.behavior.cooperationRating || "N/A" },
        selfControlRating: { category: "Self Control", grade: data.behavior.selfControlRating || "N/A" },
        responsibilityRating: { category: "Responsibility", grade: data.behavior.responsibilityRating || "N/A" },
        initiativeRating: { category: "Initiative", grade: data.behavior.initiativeRating || "N/A" },
        leadershipRating: { category: "Leadership", grade: data.behavior.leadershipRating || "N/A" },
      };
      return Object.values(ratingMap).filter((item) => item.grade !== "N/A");
    }

    // Fallback: derive behavior from student_grades columns (attitude_marks, homework_marks)
    if (data.grades.length > 0) {
      const avgAttitude = Math.round(
        data.grades.reduce((sum, g) => sum + g.attitudeMarks, 0) / data.grades.length
      );
      const avgHomework = Math.round(
        data.grades.reduce((sum, g) => sum + g.homeworkMarks, 0) / data.grades.length
      );

      const items: { category: string; grade: string }[] = [];
      
      if (avgAttitude > 0) {
        items.push({ category: "Initiative / Attitude", grade: getBehaviorGrade(avgAttitude) });
      }
      if (avgHomework > 0) {
        items.push({ category: "Homework Submission", grade: getBehaviorGrade(avgHomework) });
      }

      return items;
    }

    return [];
  }, [data.behavior, data.grades]);

  // Computed: awards items for UI (from cocurricular)
  const awards = useMemo(() => {
    if (data.cocurricular.length === 0) return null;

    // Get current period's cocurricular data
    const currentPeriod = data.cocurricular.find(c => c.academicPeriodId === academicPeriodId);
    if (!currentPeriod) return null;

    return {
      sportsHouse: {
        organization: currentPeriod.sportsHouseOrg || "None",
        role: currentPeriod.sportsHouseRole || "",
      },
      club: {
        organization: currentPeriod.clubOrg || "None",
        role: currentPeriod.clubRole || "",
      },
      studentLeadership: {
        organization: currentPeriod.leadershipOrg || "None",
        role: currentPeriod.leadershipRole || "",
      },
      events: {
        organization: currentPeriod.eventsOrg || "None",
        role: currentPeriod.eventsRole || "",
      },
      achievements: {
        event: currentPeriod.achievementsEvent || "None",
        award: currentPeriod.achievementsAward || "",
      },
    };
  }, [data.cocurricular, academicPeriodId]);

  // Computed: Check if we have any data
  const hasData = useMemo(() => {
    return data.grades.length > 0 || data.behavior !== null || data.cocurricular.length > 0;
  }, [data]);

  return {
    academicPeriods,
    periodsLoading,
    grades: data.grades,
    behavior: data.behavior,
    behaviorItems,
    cocurricular: data.cocurricular,
    awards,
    loading,
    error,
    hasData,
    refetch: fetchReportCardData,
  };
}
