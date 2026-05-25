import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface AcademicPeriod {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  academicYear: number | null;
  academicPeriodId: string | null;
  academicPeriodName: string | null;
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
  studyRecommendation: string | null;
  classStudyRecommendation: string | null;
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

const isDev = import.meta.env?.DEV;

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

const getStudentClassYearId = async (studentId: string): Promise<number | null> => {
  const { data, error } = await supabase.rpc("get_student_class_year_id", {
    p_student_id: studentId,
  });
  if (error) {
    console.error("[useStudentReportCard] get_student_class_year_id failed:", error);
    return null;
  }
  return data ?? null;
};

export function useStudentReportCard(
  studentId: string | null,
  examPeriodId: string | null,
  academicPeriodId: string | null = null
) {
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [data, setData] = useState<StudentReportCardData>({
    grades: [],
    behavior: null,
    cocurricular: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggedCsrRowsRef = useRef(false);

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
            .select("id, name, code, sort_order, created_at, academic_year")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          
          console.log("[useStudentReportCard] Fallback periods:", { allPeriods, fallbackError });
          
          setAcademicPeriods(
            (allPeriods || []).map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code || "",
              sortOrder: p.sort_order ?? 0,
              academicYear: p.academic_year ?? null,
              academicPeriodId: p.id,
              academicPeriodName: p.name,
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
            .select("id, name, code, sort_order, created_at, academic_year")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          
          console.log("[useStudentReportCard] All periods query:", { allPeriods, allPeriodsError });
          
          setAcademicPeriods(
            (allPeriods || []).map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code || "",
              sortOrder: p.sort_order ?? 0,
              academicYear: p.academic_year ?? null,
              academicPeriodId: p.id,
              academicPeriodName: p.name,
            }))
          );
          return;
        }

        // Step 3: Fetch period details for those IDs from academic_periods
        const { data: periods, error: periodsError } = await supabase
          .from("academic_periods")
          .select("id, name, code, sort_order, created_at, academic_year")
          .in("id", uniquePeriodIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        console.log("[useStudentReportCard] academic_periods query result:", {
          periods,
          periodsError,
          queriedIds: uniquePeriodIds,
        });

        if (periodsError) {
          console.error(
            "[useStudentReportCard] academic_periods query FAILED:",
            periodsError
          );
          throw periodsError;
        }

        // Gate parent-visible report-card periods on the existence of an
        // exam_period_publications row. The sibling (admin/web) project
        // creates these rows when results are officially published.
        // If the table is not yet readable by parents (RLS), fall back to
        // showing all periods and log a warning so we know to add an RPC.
        let publishedPeriodIds: Set<string> | null = null;
        try {
          const { data: pubs, error: pubsError } = await supabase
            .from("exam_period_publications")
            .select("academic_period_id")
            .in("academic_period_id", uniquePeriodIds);

          if (pubsError) {
            console.warn(
              "[useStudentReportCard] exam_period_publications not readable by parent — falling back to all periods. Add a parent-readable view/RPC on the sibling project.",
              pubsError
            );
          } else {
            publishedPeriodIds = new Set(
              (pubs || [])
                .map((row: any) => row.academic_period_id)
                .filter((id: any): id is string => typeof id === "string")
            );
          }
        } catch (e) {
          console.warn("[useStudentReportCard] exam_period_publications query threw — falling back.", e);
        }

        const filteredPeriods = publishedPeriodIds
          ? (periods || []).filter((p) => publishedPeriodIds!.has(p.id))
          : periods || [];

        const mappedPeriods = filteredPeriods.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code || "",
          sortOrder: p.sort_order ?? 0,
          academicYear: p.academic_year ?? null,
          academicPeriodId: p.id,
          academicPeriodName: p.name,
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
    if (!studentId || !examPeriodId) {
      setData({ grades: [], behavior: null, cocurricular: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("[useStudentReportCard] auth session:", {
        sessionError,
        hasSession: Boolean(sessionData.session),
        sessionUserId: sessionData.session?.user?.id ?? null,
      });
      console.log("[useStudentReportCard] auth user:", {
        userError,
        userId: userData.user?.id ?? null,
      });

      // Fetch grades with subject info
      let gradesQuery = supabase
        .from("student_grades")
        .select(`
          id,
          subject_id,
          academic_period_id,
          quiz_marks,
          homework_marks,
          exam_marks,
          attitude_marks,
          total_marks,
          letter_grade,
          subject_comment,
          teacher_comment,
          study_recommendation,
          subjects:subject_id (id, name, category)
        `)
        .eq("student_id", studentId)
        .eq("academic_period_id", examPeriodId);

      // If the caller provides a year-level academic period ID, we rely on
      // the selected exam period as the primary filter. The exam period ID
      // should uniquely imply its academic year in the current schema.
      if (academicPeriodId) {
        void academicPeriodId;
      }

      const { data: gradesData, error: gradesError } = await gradesQuery;

      if (gradesError) {
        console.error("[useStudentReportCard] student_grades query failed:", gradesError);
        throw gradesError;
      }

      let classRecommendationMap = new Map<string, string>();
      let classYearId: number | null = null;

      if (studentId) {
        classYearId = await getStudentClassYearId(studentId);
      }

      if (classYearId && gradesData && gradesData.length > 0) {
        const subjectIds = Array.from(
          new Set(
            gradesData
              .map((g: any) => g.subject_id)
              .filter((id: any): id is number => Number.isInteger(id))
          )
        );
        const uniqueAcademicPeriodIds = Array.from(
          new Set(
            gradesData
              .map((g: any) => g.academic_period_id)
              .filter((id: any): id is string => typeof id === "string" && id.length > 0)
          )
        );

        if (subjectIds.length > 0 && uniqueAcademicPeriodIds.length > 0) {
          const { data: classRecommendations, error: classRecommendationsError } = await supabase
            .from("class_study_recommendations")
            .select("subject_id, academic_period_id, recommendation, updated_at")
            .eq("class_year_id", classYearId)
            .in("academic_period_id", uniqueAcademicPeriodIds)
            .in("subject_id", subjectIds)
            .order("updated_at", { ascending: false });

          if (classRecommendationsError) {
            console.error("[useStudentReportCard] class_study_recommendations query failed:", classRecommendationsError);
          } else {
            const rows = classRecommendations || [];
            if (isDev && !loggedCsrRowsRef.current) {
              console.log("[useStudentReportCard] CSR rows fetched:", rows);
              loggedCsrRowsRef.current = true;
            }

            rows.forEach((rec: any) => {
              const key = `${rec.subject_id}:${rec.academic_period_id}`;
              if (!classRecommendationMap.has(key) && rec.recommendation) {
                classRecommendationMap.set(key, rec.recommendation);
              }
            });

            if (isDev) {
              console.log("[useStudentReportCard] CSR map keys:", Array.from(classRecommendationMap.keys()));
            }
          }
        }
      }

      const grades: SubjectGrade[] = (gradesData || []).map((g: any) => {
        const lookupKey = `${g.subject_id}:${g.academic_period_id}`;
        const lookupValue = classRecommendationMap.get(lookupKey) ?? "-";
        if (isDev) {
          console.log("[useStudentReportCard] CSR lookup:", {
            key: lookupKey,
            value: lookupValue,
          });
        }
        return {
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
        // Prefer the dedicated column; fall back to legacy subject_comment if not yet migrated.
        studyRecommendation: g.study_recommendation ?? g.subject_comment ?? null,
        classStudyRecommendation: lookupValue,
      };
      });

      // Fetch behavior assessment
      const { data: behaviorData, error: behaviorError } = await supabase
        .from("behavioral_assessments")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_period_id", examPeriodId)
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

      // Fetch cocurricular activities for this student and academic period
      console.log("[useStudentReportCard] Fetching cocurricular activities:", {
        selectedStudentId: studentId,
        selectedAcademicPeriodId: examPeriodId,
      });

      const { data: cocurricularData, error: cocurricularError } = await supabase
        .from("student_cocurricular_activities")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_period_id", examPeriodId);

      console.log("[useStudentReportCard] Cocurricular query result:", {
        cocurricularData,
        cocurricularError,
        rowCount: cocurricularData?.length ?? 0,
      });

      if (cocurricularError) {
        console.error("[useStudentReportCard] student_cocurricular_activities query FAILED:", cocurricularError);
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

      console.log("[useStudentReportCard] Mapped cocurricular activities:", cocurricular);

      setData({ grades, behavior, cocurricular });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load report card data";
      console.error("[useStudentReportCard] Error:", err);
      setError(message);
      setData({ grades: [], behavior: null, cocurricular: [] });
    } finally {
      setLoading(false);
    }
  }, [studentId, examPeriodId, academicPeriodId]);

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

    // No behavioral assessment recorded yet for this period.
    // We intentionally do NOT derive behavior grades from attitude/homework
    // marks — those low marks (often 0 placeholders) would otherwise be
    // shown as "E", which misrepresents un-entered data.
    return [];
  }, [data.behavior, data.grades]);

  // Computed: awards items for UI (from cocurricular)
  const awards = useMemo(() => {
    console.log("[useStudentReportCard] Computing awards from cocurricular:", {
      cocurricularLength: data.cocurricular.length,
      academicPeriodId: examPeriodId,
    });

    if (data.cocurricular.length === 0) {
      console.log("[useStudentReportCard] No cocurricular data available");
      return null;
    }

    // Since we now filter by academic_period_id in the query, take the first row
    const currentPeriod = data.cocurricular[0];
    
    console.log("[useStudentReportCard] Awards data for current period:", currentPeriod);

    return {
      sportsHouse: {
        organization: currentPeriod.sportsHouseOrg || "None",
        role: currentPeriod.sportsHouseRole || "Member",
      },
      club: {
        organization: currentPeriod.clubOrg || "None",
        role: currentPeriod.clubRole || "Member",
      },
      studentLeadership: {
        organization: currentPeriod.leadershipOrg || "None",
        role: currentPeriod.leadershipRole || "Member",
      },
      events: {
        organization: currentPeriod.eventsOrg || "None",
        role: currentPeriod.eventsRole || "Member",
      },
      achievements: {
        event: currentPeriod.achievementsEvent || "None",
        award: currentPeriod.achievementsAward || "",
      },
    };
  }, [data.cocurricular, examPeriodId]);

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
