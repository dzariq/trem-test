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
  cocurricular: CocurricularActivity | null;
}

export function useStudentReportCard(studentId: string | null, academicPeriodId: string | null) {
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [data, setData] = useState<StudentReportCardData>({
    grades: [],
    behavior: null,
    cocurricular: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch academic periods
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const { data: periods, error: periodsError } = await supabase
          .from("academic_periods")
          .select("id, name, code, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (periodsError) throw periodsError;

        setAcademicPeriods(
          (periods || []).map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            sortOrder: p.sort_order ?? 0,
          }))
        );
      } catch (err) {
        console.error("[useStudentReportCard] Error fetching periods:", err);
      }
    };

    fetchPeriods();
  }, []);

  // Fetch report card data for selected student and period
  const fetchReportCardData = useCallback(async () => {
    if (!studentId || !academicPeriodId) {
      setData({ grades: [], behavior: null, cocurricular: null });
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

      if (gradesError) throw gradesError;

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
        letterGrade: g.letter_grade,
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

      if (behaviorError) throw behaviorError;

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

      // Fetch cocurricular activities
      const { data: cocurricularData, error: cocurricularError } = await supabase
        .from("student_cocurricular_activities")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_period_id", academicPeriodId)
        .maybeSingle();

      if (cocurricularError) throw cocurricularError;

      const cocurricular: CocurricularActivity | null = cocurricularData
        ? {
            id: cocurricularData.id,
            sportsHouseOrg: cocurricularData.sports_house_org,
            sportsHouseRole: cocurricularData.sports_house_role,
            clubOrg: cocurricularData.club_org,
            clubRole: cocurricularData.club_role,
            leadershipOrg: cocurricularData.leadership_org,
            leadershipRole: cocurricularData.leadership_role,
            eventsOrg: cocurricularData.events_org,
            eventsRole: cocurricularData.events_role,
            achievementsEvent: cocurricularData.achievements_event,
            achievementsAward: cocurricularData.achievements_award,
          }
        : null;

      setData({ grades, behavior, cocurricular });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load report card data";
      console.error("[useStudentReportCard] Error:", err);
      setError(message);
      setData({ grades: [], behavior: null, cocurricular: null });
    } finally {
      setLoading(false);
    }
  }, [studentId, academicPeriodId]);

  useEffect(() => {
    fetchReportCardData();
  }, [fetchReportCardData]);

  // Computed: behavior items for UI
  const behaviorItems = useMemo(() => {
    if (!data.behavior) return [];

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
  }, [data.behavior]);

  // Computed: awards items for UI (from cocurricular)
  const awards = useMemo(() => {
    if (!data.cocurricular) return null;

    return {
      sportsHouse: {
        organization: data.cocurricular.sportsHouseOrg || "None",
        role: data.cocurricular.sportsHouseRole || "",
      },
      club: {
        organization: data.cocurricular.clubOrg || "None",
        role: data.cocurricular.clubRole || "",
      },
      studentLeadership: {
        organization: data.cocurricular.leadershipOrg || "None",
        role: data.cocurricular.leadershipRole || "",
      },
      events: {
        organization: data.cocurricular.eventsOrg || "None",
        role: data.cocurricular.eventsRole || "",
      },
      achievements: {
        event: data.cocurricular.achievementsEvent || "None",
        award: data.cocurricular.achievementsAward || "",
      },
    };
  }, [data.cocurricular]);

  // Computed: Check if we have any data
  const hasData = useMemo(() => {
    return data.grades.length > 0 || data.behavior !== null || data.cocurricular !== null;
  }, [data]);

  return {
    academicPeriods,
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
